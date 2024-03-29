import crypto from 'node:crypto';
import Debug from 'debug';
import os from 'node:os';
import path from '../util/universalPath';
import fsp from 'node:fs/promises';
import mkdirp from 'mkdirp';
import { XMLParser } from 'fast-xml-parser';
import uniqBy from 'lodash/uniqBy';

import { downloadFile } from '../util/downloadFile';
import { extractZipFileToPath } from '../util/zip';
import {
	Catalog,
	CatalogEntry,
	DBJSON,
	HashedFileEntry,
	GameMetadata,
	MetadataDB,
	MissingRomEntry,
	Update,
	UpdateCallback,
	UpdateReason,
	NonHashedCatalogFileEntry,
	HashedCatalogFileEntry,
} from './types';
import { UpdateDbConfig } from '../settings/types';
import { exists, getGameCacheDir, size } from '../util/fs';
import isEqual from 'lodash/isEqual';
import { batch } from '../util/batch';
import { slugMap } from './slugMap';
import { ArcadeItaliaMetadata, arcadeItaliaData } from './arcadeItaliaData';
import * as settings from '../settings';
import { defaultUpdateDbs } from '../settings/defaultUpdateDbs';
import { areAllNonDependentDbsEnabled } from '../settings/util';
import { getAllCatalogEntries } from './util';
import { getDatedFilenamePathComponents } from '../util/getDatedFilenamePathComponents';

let _currentCatalog: Catalog | null = null;

class CancelUpdateError extends Error {}
class DownloadRomError extends Error {}

const debug = Debug('main/catalog/catalog.ts');

const xmlParser = new XMLParser({
	ignoreAttributes: false,
	numberParseOptions: { leadingZeros: false, hex: false },
});

const METADATADB_URL =
	'https://raw.githubusercontent.com/Toryalai1/MiSTer_ArcadeDatabase/db/mad_db.json.zip';

const ROMDB_URL =
	'https://raw.githubusercontent.com/theypsilon/ArcadeROMsDB_MiSTer/db/arcade_roms_db.json.zip';
/**
 * Some entries in the metadatadb don't match up with MAME slugs,
 * this map fixes that
 * TODO: can this be done better?
 */
const slugPatchMap: Record<string, string> = {
	amidars: 'amidar',
	alienaru: 'alienar',
	atlantis2: 'atlantis',
	beastfp: 'suprglob',
	crush2: 'crush',
	demoderm: 'demoderb',
	devilfsg: 'devlfsh',
	eeekkp: 'eeekk',
	gallopm72: 'cosmccop',
	lupin3a: 'lupin3',
	mimonscr: 'mimonkey',
	mooncrgx: 'mooncrst',
	nspiritj: 'nspirit',
	rpatroln: 'raptrol',
	tigerhb1: 'tigerh',
	twotigerc: 'twotiger',
	victorycb: 'victoryc',
	xsleenab: 'xsleena',
};

async function getMetadataDb(): Promise<MetadataDB> {
	const rawMetadataDb = (await getDbJson(
		METADATADB_URL
	)) as unknown as Promise<MetadataDB>;

	return Object.entries(rawMetadataDb).reduce<MetadataDB>((accum, entry) => {
		return {
			...accum,
			[slugPatchMap[entry[0]] ?? entry[0]]: entry[1],
		};
	}, {});
}

/**
 * Writes warning.txt into the gameCache dir. This lets the user know that
 * altering files in the gameCache might break AMMiSTer
 */
async function writeGameCacheWarning(gameCacheDirPath: string): Promise<void> {
	const warningTxt = `AMMiSTER gameCache Warning
=========================

Changing files in this directory or its subdirectories could cause
AMMister to not work properly. 

If you do make changes in here:

- delete the catalog.json file, relaunch AMMiSTer, then in AMMiSTer check for updates.
This will cause AMMiSTer to rebuild its catalog based on what is in this directory.
Heads up, an update may replace any files you have deleted.

- any plan files you have (.amip files) may rely on files you have deleted or changed.
If so, exporting with that plan may cause errors.
`;

	const warningTxtPath = path.resolve(gameCacheDirPath, 'warning.txt');
	try {
		await fsp.writeFile(warningTxtPath, warningTxt);
	} catch (e) {
		// warning.txt failing is purposely swallowed as an error here
		// should not prevent the update from finishing
		debug('witeGameCacheWarning failed', e);
	}
}

/**
 * Pulls down the db file from the given url. Most db files are zipped,
 * so will also unzip it if so
 */
async function getDbJson(url: string): Promise<DBJSON> {
	const tmpDir = path.resolve(os.tmpdir(), 'ammister');
	await mkdirp(tmpDir);

	const fileName = path.basename(url);
	const filePath = path.resolve(tmpDir, fileName);

	await downloadFile(url, filePath);

	const fileExt = path.extname(url);

	if (fileExt === '.json') {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return require(filePath) as DBJSON;
	}

	const extractedJsonPaths = await extractZipFileToPath(filePath);
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	return require(extractedJsonPaths[0]) as DBJSON;
}

/**
 * this ensures db_id names don't have any forward or back slashes in them,
 * otherwise the db's files will get stored in sub directories
 * under the gameCache
 */
function cleanDbId(db_id: string): string {
	return db_id.replace(/\//g, '_').replace(/\\/g, '_');
}

/**
 * Given a relative file path like "_Arcade/foo/bar/game.mra",
 * returns "_Arcade/game.mra". Will maintain "_Arcade/cores"
 * for core files. This is the main place that "undoing"
 * pre-existing db organization is done, pushing all files to the top
 * of the db's cache. Instead, users will organize as they see fit.
 *
 * TODO: this might cause clashes if two files flatten to the same
 * flattened path.
 */
function flattenRelFilePath(relFilePath: string): string {
	const split = relFilePath.split('/');

	const flattenedPath = [split[0]];

	if (split[1] === 'cores') {
		flattenedPath.push(split[1]);
	}

	flattenedPath.push(split[split.length - 1]);

	return flattenedPath.join('/');
}

/**
 * Takes a db as pulled from the internet and converts it
 * into FileEntrys for easier processing
 */
function convertDbToFileEntries(db: DBJSON): HashedFileEntry[] {
	const entries = Object.entries(db.files);

	return entries.map((e) => {
		const dbRelFilePath = e[0];
		const flattenedRelFilePath = flattenRelFilePath(e[0]);
		const { hash, size, url } = e[1];

		return {
			db_id: cleanDbId(db.db_id),
			type: path.extname(flattenedRelFilePath).substring(1) as 'mra' | 'rbf',
			dbRelFilePath,
			relFilePath: flattenedRelFilePath,
			fileName: path.basename(flattenedRelFilePath),
			remoteUrl: url ?? db.base_files_url + dbRelFilePath,
			md5: hash,
			size,
		};
	});
}

/**
 * Returns the md5 hash of the provided data. This should only
 * be used for verififcation of a local file against a provided hash,
 * and not to set a hash.
 */
function getFileMd5Hash(data: Buffer | string): string {
	return crypto.createHash('md5').update(data).digest('hex');
}

function isErrorWithCode(e: unknown): e is { code: string } {
	return (
		e !== null && (typeof e === 'object' || e instanceof Error) && 'code' in e
	);
}

/**
 * Given a FileEntry just pulled from a db file, determines what kind of
 * update is needed to make sure AMMister's gameCache has the latest version
 */
async function determineUpdate(
	fileEntry: HashedFileEntry
): Promise<Update | null> {
	const gameCacheDir = await getGameCacheDir();
	const fullPath = path.resolve(
		gameCacheDir,
		fileEntry.db_id,
		fileEntry.relFilePath
	);

	debug(`determineUpdate, full path: ${fullPath}`);

	try {
		const fileData = await fsp.readFile(fullPath);
		const md5 = getFileMd5Hash(fileData);

		debug(
			`determineUpdate for ${fileEntry.fileName}, local hash: ${md5} versus db hash: ${fileEntry.md5}`
		);

		if (md5 === fileEntry.md5) {
			debug(`determineUpdate, no update needed for ${fileEntry.fileName}`);
			return null;
		}

		return {
			fileEntry,
			updateReason: 'updated',
		};
	} catch (e) {
		if (isErrorWithCode(e) && e.code === 'ENOENT') {
			return {
				fileEntry,
				updateReason: 'missing',
			};
		} else {
			throw new Error(
				`db#determineUpdate: unexpected error when reading ${fileEntry.fileName}: ${e}`
			);
		}
	}
}

/**
 * Takes an Update and downloads the corresponding file it represents,
 * performing the update
 */
async function updateFile(update: Update): Promise<void> {
	const gameCacheDir = await getGameCacheDir();
	await mkdirp(gameCacheDir);

	const fullPath = path.resolve(
		gameCacheDir,
		update.fileEntry.db_id,
		update.fileEntry.relFilePath
	);
	await mkdirp(path.dirname(fullPath));
	debug('downloading', fullPath);
	return downloadFile(update.fileEntry.remoteUrl, fullPath);
}

/**
 * For a given db, determines what needs to be updated and then updates
 * them. Returns what was updated and why
 */
async function downloadUpdatesForDb(
	db_id: string,
	fileEntries: HashedFileEntry[],
	cb: (err: null | string, update: Update) => void
): Promise<Update[]> {
	const updates: Update[] = [];

	// the default batch size is 4
	// TODO: can probably bump this up to make
	// the update even faster
	const batches = batch(fileEntries);

	for (const batch of batches) {
		const batchPromises = batch.map(async (fileEntry) => {
			const update = await determineUpdate(fileEntry);

			if (update) {
				cb(null, update);

				debug(
					`downloadUpdatesForDb, update for ${fileEntry.fileName}: ${update.updateReason}`
				);
				try {
					await updateFile(update);
					updates.push(update);
				} catch (e) {
					const message = e instanceof Error ? e.message : String(e);
					cb(null, {
						...update,
						error: true,
						errorMessage: message,
					});
				}
			}
		});

		await Promise.all(batchPromises);
	}

	debug('Finished updating for', db_id, 'updates.length', updates.length);

	return updates;
}

function determineMAMESlug(
	romEntries: NonHashedCatalogFileEntry[],
	fallbackSlug?: string | null
): string | null {
	const slugs = romEntries.map((r) => path.parse(r.fileName).name);

	if (fallbackSlug) {
		slugs.push(fallbackSlug);
	}

	const debugHeader = `determineMAMESlug(${slugs.join(',')})`;
	debug(debugHeader);

	for (const slug of slugs) {
		const isCorrectSlug = slugMap[slug];

		if (isCorrectSlug) {
			debug(`${debugHeader}: got ${slug} from slugMap`);
			return slug;
		}
	}

	debug(
		`${debugHeader}: failed to find a slug in slugMap for ${slugs.join(',')}`
	);
	return null;
}

function determineArcadeItaliaSlug(
	romEntries: NonHashedCatalogFileEntry[],
	fallbackSlug?: string | null
): string | null {
	const slugs = romEntries.map((r) => path.parse(r.fileName).name);

	if (fallbackSlug) {
		slugs.push(fallbackSlug);
	}

	for (const slug of slugs) {
		const isCorrectSlug = !!arcadeItaliaData[slug];

		if (isCorrectSlug) {
			return slug;
		}
	}

	return null;
}

function xmlToArray(val: string | string[] | null | undefined): string[] {
	if (!val) {
		return [];
	}

	if (Array.isArray(val)) {
		// TODO: shouldn't this be !!v ?
		return val.filter((v) => !v);
	}

	return [val];
}

/**
 * Takes an mra file and parses it to grab its metadata and ultimately
 * form a catalog entry.
 *
 * Returns null to indicate this entry should not be added to the catalog.
 * Today that only happens for hbmame games
 */
async function parseMraToCatalogEntry(
	db_id: string,
	mraFileEntry: HashedFileEntry,
	fileEntries: HashedFileEntry[],
	metadataDb: MetadataDB
): Promise<CatalogEntry | null> {
	const updateDb = defaultUpdateDbs.find((udb) => udb.db_id === db_id);
	if (!updateDb) {
		throw new Error('failed to find a default updatedb entry for: ' + db_id);
	}

	debug(
		`parseMraToCatalogEntry(${db_id}, ${mraFileEntry.relFilePath}, fileEntries, metadataDb)`
	);
	try {
		const gameCacheDir = await getGameCacheDir();
		const mraAbsFilePath = path.resolve(
			gameCacheDir,
			db_id,
			mraFileEntry.relFilePath
		);
		const mraData = (await fsp.readFile(mraAbsFilePath)).toString();

		const parsed = xmlParser.parse(mraData);
		const {
			name,
			manufacturer,
			category,
			year,
			rom,
			rbf,
			setname,
			parent,
			mameVersion,
		} = parsed.misterromdescription;

		const rbfFileEntry = fileEntries.find((fe) => {
			if (fe.type !== 'rbf') {
				return false;
			}

			const baseFileName = path.parse(fe.fileName).name;
			const fileNameComponents = getDatedFilenamePathComponents(baseFileName);

			return (
				(fileNameComponents?.fileNameBase ?? baseFileName).toLowerCase() === rbf
			);
		});

		const romEntries = Array.isArray(rom) ? rom : [rom];
		const romEntryWithZip = romEntries.find(
			(r: { '@_zip'?: string }) => !!r['@_zip']
		);
		const romFile = romEntryWithZip?.['@_zip'];

		if (!romFile) {
			debug(`parseMraToCatalogEntry, ${name} has no rom zip specified`);
		}

		const romCatalogFileEntries: NonHashedCatalogFileEntry[] = [];

		if (romFile && !updateDb.isDependent) {
			for (const r of romFile.split('|')) {
				const romPath = path.resolve(gameCacheDir, db_id, 'games', 'mame', r);
				const romExists = await exists(romPath);

				romCatalogFileEntries.push({
					db_id,
					fileName: r,
					relFilePath: path.join('games', 'mame', r),
					type: 'rom',
					status: romExists ? 'ok' : 'missing',
					// TODO: should be able to get this from the arcade rom db
					size: await size(romPath),
				});
			}
		}

		const isHbmameGame = romCatalogFileEntries.some((rcfe) => {
			return rcfe.relFilePath.includes('hbmame');
		});

		if (isHbmameGame) {
			return null;
		}

		const mameSlug = determineMAMESlug(
			romCatalogFileEntries,
			setname || parent
		);
		const arcadeItaliaSlug = determineArcadeItaliaSlug(
			romCatalogFileEntries,
			setname || parent
		);

		let yearReleased: number | null = parseInt(year, 10);
		if (isNaN(yearReleased)) {
			yearReleased = null;
		}

		const metadataEntry = (
			mameSlug ? metadataDb[mameSlug] ?? {} : {}
		) as Partial<GameMetadata>;

		const arcadeItaliaEntry = (
			arcadeItaliaSlug ? arcadeItaliaData[arcadeItaliaSlug] ?? {} : {}
		) as Partial<ArcadeItaliaMetadata>;

		const catalogEntry: CatalogEntry = {
			db_id,
			gameName: name,
			romSlug: mameSlug ?? null,
			manufacturer: metadataEntry.manufacturer ?? xmlToArray(manufacturer),
			yearReleased,
			category: metadataEntry.category ?? xmlToArray(category),
			mameVersion,
			alternative: metadataEntry.alternative ?? false,
			bootleg: metadataEntry.bootleg ?? false,
			flip: metadataEntry.flip ?? false,
			num_buttons: metadataEntry.num_buttons ?? null,
			players: metadataEntry.players ?? null,
			region: metadataEntry.region ?? null,
			resolution: metadataEntry.resolution ?? null,
			rotation:
				typeof metadataEntry.rotation === 'number'
					? metadataEntry.rotation
					: null,
			series: metadataEntry.series ?? [],
			move_inputs: metadataEntry.move_inputs ?? [],
			platform: metadataEntry.platform ?? [],
			special_controls:
				!metadataEntry.special_controls ||
				isEqual(metadataEntry.special_controls, ['n-a'])
					? []
					: metadataEntry.special_controls,
			titleScreenshotUrl: mameSlug
				? `https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/titles/${mameSlug}.png`
				: null,
			gameplayScreenshotUrl: mameSlug
				? `https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/snap/${mameSlug}.png`
				: null,
			shortPlayVideoId: arcadeItaliaEntry.videoId ?? null,
			arcadeItaliaRating: arcadeItaliaEntry.rating ?? null,
			files: {
				mra: {
					db_id,
					type: 'mra',
					fileName: path.basename(mraFileEntry.relFilePath),
					dbRelFilePath: mraFileEntry.dbRelFilePath,
					relFilePath: mraFileEntry.relFilePath,
					md5: mraFileEntry.md5,
					status: 'ok',
					size: mraFileEntry.size,
				},
				roms: romCatalogFileEntries,
			},
		};

		if (rbfFileEntry && !updateDb.isDependent) {
			catalogEntry.files.rbf = {
				db_id,
				type: 'rbf',
				fileName: path.basename(rbfFileEntry.relFilePath),
				dbRelFilePath: rbfFileEntry.dbRelFilePath,
				relFilePath: rbfFileEntry.relFilePath,
				md5: rbfFileEntry.md5,
				status: 'ok',
				size: rbfFileEntry.size,
			};
		}

		return catalogEntry;
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		debug(
			`parseMraToCatalogEntry error for ${mraFileEntry.relFilePath}: ${message}`
		);
		throw e;
	}
}

async function buildSubCatalog(
	db_id: string,
	fileEntries: HashedFileEntry[],
	metadataDb: MetadataDB,
	cb: (entry: CatalogEntry) => void
): Promise<Partial<Catalog>> {
	const mraEntries = fileEntries.filter((fe) => fe.type === 'mra');

	const catalogEntryPromises = mraEntries.map(async (mraEntry) => {
		const catalogEntry = await parseMraToCatalogEntry(
			db_id,
			mraEntry,
			fileEntries,
			metadataDb
		);

		if (catalogEntry) {
			cb(catalogEntry);
		}
		return catalogEntry;
	});

	const catalogEntries = await Promise.all(catalogEntryPromises);

	return {
		[db_id]: catalogEntries.filter((ce) => !!ce) as CatalogEntry[],
	};
}

async function buildGameCatalog(
	metadataDb: MetadataDB,
	dbFileEntryMap: Record<string, HashedFileEntry[]>,
	cb: (entry: CatalogEntry) => void
): Promise<Catalog> {
	const dbEntries = Object.entries(dbFileEntryMap);

	const subCatalogPromises = dbEntries.map(([db_id, files]) =>
		buildSubCatalog(db_id, files, metadataDb, cb)
	);
	const subCatalogs = await Promise.all(subCatalogPromises);

	const catalog = subCatalogs.reduce<Partial<Catalog>>((accum, entry) => {
		return {
			...accum,
			...entry,
		};
	}, {});

	catalog.updatedAt = Date.now();

	return catalog as Catalog;
}

function getRomDownloadUrl(
	r: NonHashedCatalogFileEntry,
	romDB: DBJSON
): string | null {
	const entry = romDB.files[`|games/mame/${r.fileName}`];

	return entry?.url ?? null;
}

async function determineMissingRoms(
	catalog: Catalog
): Promise<MissingRomEntry[]> {
	const catalogEntries = getAllCatalogEntries(catalog);

	const entriesMissingTheirRom = catalogEntries.filter((ce) =>
		ce.files.roms?.some(
			(r) => r.status === 'missing' || r.status === 'unexpected-missing'
		)
	);

	const romDb =
		entriesMissingTheirRom.length > 0 ? await getDbJson(ROMDB_URL) : {};

	return entriesMissingTheirRom.flatMap<MissingRomEntry>((ce) => {
		return ce.files.roms
			.filter((r) => r.status !== 'ok')
			.map((r) => {
				return {
					db_id: ce.db_id,
					romFile: r.fileName,
					remoteUrl: getRomDownloadUrl(r, romDb as DBJSON),
				};
			});
	});
}

type MissingRomEntryWRemoteUrl = Omit<MissingRomEntry, 'remoteUrl'> & {
	remoteUrl: string;
};

async function downloadRom(
	romEntry: MissingRomEntryWRemoteUrl
): Promise<Update> {
	const gameCacheDir = await getGameCacheDir();

	debug(`downloadRom, getting ${romEntry.romFile}`);

	const fileName = path.basename(romEntry.remoteUrl);
	// TODO: here is where hbmame support can be added
	const relFilePath = path.join('games', 'mame', fileName);
	const localPath = path.resolve(gameCacheDir, romEntry.db_id, relFilePath);

	try {
		let updateReason: UpdateReason;

		try {
			await fsp.readFile(localPath);
			updateReason = 'fulfilled';
		} catch (e) {
			debug(
				`downloadRom, downloading from: ${romEntry.remoteUrl}\n to: ${localPath}`
			);
			await downloadFile(romEntry.remoteUrl, localPath, 'application/zip');
			updateReason = 'missing';
		}

		return {
			fileEntry: {
				db_id: romEntry.db_id,
				type: 'rom',
				relFilePath,
				fileName,
				remoteUrl: romEntry.remoteUrl,
				size: await size(localPath),
			},
			updateReason,
		};
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		debug(`Failed to download from ${romEntry.remoteUrl}: ${message}`);

		return {
			fileEntry: {
				db_id: romEntry.db_id,
				type: 'rom',
				relFilePath,
				fileName,
				remoteUrl: romEntry.remoteUrl,
				size: await size(localPath),
			},
			updateReason: 'missing',
			error: true,
			errorMessage: message,
		};
	}
}

async function downloadRoms(
	romEntries: MissingRomEntry[],
	cb: (rom: Update) => void
): Promise<Update[]> {
	const allRomUpdates: Update[] = [];

	const uniqueRomEntries = uniqBy(romEntries, JSON.stringify);
	const sortedRomEntries = uniqueRomEntries.sort((a, b) => {
		return a.romFile.localeCompare(b.romFile);
	});

	const batches = batch(sortedRomEntries);

	for (const batch of batches) {
		const downloadPromises = batch.reduce<Array<Promise<Update | null>>>(
			(accum, r) => {
				if (r.remoteUrl) {
					return accum.concat(downloadRom(r as MissingRomEntryWRemoteUrl));
				} else {
					return accum;
				}
			},
			[]
		);

		try {
			const updates = (await Promise.all(downloadPromises)).filter(
				// we will quietly ignore fulfilled updates as the user doesn't need to know.
				// fulfilled means some other romEntry also had this rom and downloaded it earlier,
				// such as qsound.zip for all cps2 games. This is very unlikely/impossible as
				// the first thing we do is uniqBy the mising rom entries
				(u) => !!u && u.updateReason !== 'fulfilled'
			) as unknown as Update[];

			for (const update of updates) {
				allRomUpdates.push(update);
				cb(update);
			}
		} catch (e) {
			// TODO: this can also be a cancel exception, in that case, just rethrow it
			const message = e instanceof Error ? e.message : String(e);
			throw new DownloadRomError(message);
		}
	}

	return allRomUpdates;
}

function addMisingRomsToCatalog(
	romUpdates: Update[],
	catalog: Catalog
): Catalog {
	for (const romUpdate of romUpdates) {
		const db = catalog[romUpdate.fileEntry.db_id];

		// games can share roms, such as qsound.zip for cps2 games
		const gameEntries = db.filter((ce) => {
			return ce.files.roms.some(
				(r) => romUpdate.fileEntry.fileName === r.fileName
			);
		});

		gameEntries.forEach((gameEntry) => {
			gameEntry.files.roms.forEach((r) => {
				if (r.fileName === romUpdate.fileEntry.fileName) {
					r.status = 'ok';
				}
			});
		});
	}

	return catalog;
}

/**
 * An orchestration function for doing a full update. The callback is intended
 * for updating the UI as it progresses
 */
async function updateCatalog(
	providedCallback: UpdateCallback
): Promise<{ updates: Update[]; catalog: Catalog }> {
	const start = Date.now();

	let canceled = false;

	const downloadRomsSetting = await settings.getSetting('downloadRoms');
	const updateDbs = await settings.getSetting<UpdateDbConfig[]>('updateDbs');

	const allNonDependentDbsEnabled = areAllNonDependentDbsEnabled(updateDbs);
	const enabledUpdateDbs = updateDbs.filter(
		(db) => db.enabled && (!db.isDependent || allNonDependentDbsEnabled)
	);

	const callback: UpdateCallback = (args) => {
		debug(args.message);
		const userProceeding = providedCallback(args);
		if (!userProceeding && !canceled) {
			canceled = true;
			throw new CancelUpdateError();
		}
		return userProceeding;
	};

	const FAIL_RETURN: { updates: Update[]; catalog: Catalog } = {
		updates: [],
		// @ts-expect-error
		catalog: { updatedAt: Date.now() },
	};

	try {
		const gameCacheDir = await getGameCacheDir();
		await mkdirp(gameCacheDir);
		await writeGameCacheWarning(gameCacheDir);

		const updates: Update[] = [];

		const currentCatalog = await getCurrentCatalog();

		callback({
			fresh: !currentCatalog,
			message: 'Getting the latest MiSTer Arcade Database...',
		});

		const metadataDb = await getMetadataDb();

		let updateDbErrorOccurred = false;

		const dbFileEntryMap: Record<string, HashedFileEntry[]> = {};

		for (const updateDb of enabledUpdateDbs) {
			callback({
				fresh: !currentCatalog,
				message: `Checking for anything new in ${updateDb.displayName}`,
			});

			const dbResult = await getDbJson(updateDb.url);
			const dbFileEntries = convertDbToFileEntries(dbResult).filter(
				(f) =>
					f.relFilePath.startsWith('_Arcade') &&
					// TODO: deal with alternatives
					!f.dbRelFilePath.includes('_alternatives')
			);

			dbFileEntryMap[updateDb.db_id] = dbFileEntries;

			const dbUpdates = await downloadUpdatesForDb(
				updateDb.db_id,
				dbFileEntries,
				(err, update) => {
					if (err) {
						updateDbErrorOccurred = true;
						callback({
							message: '',
							error: { type: 'file-error', fileEntry: update.fileEntry },
						});
					} else {
						const verb: Record<UpdateReason, string> = {
							missing: 'Downloading',
							updated: 'Updating',
							corrupt: 'Fixing',
							fulfilled: '',
						};

						callback({
							fresh: !currentCatalog,
							message: `${verb[update.updateReason]} ${
								update.fileEntry.fileName
							}`,
						});
					}
				}
			);

			if (updateDbErrorOccurred) {
				return FAIL_RETURN;
			}

			updates.push(...dbUpdates);
		}

		let catalogUpdated = false;
		let catalog;

		// nothing to update and we already have a catalog from a previous run?
		// then just use it. If we have no catalog, we'll build a new one despite the lack of updates
		if (updates.length === 0 && currentCatalog) {
			catalog = currentCatalog;
		}

		let newlyBuiltCatalog: Catalog | null = null;
		callback({
			fresh: !currentCatalog,
			message: 'Building catalog...',
		});
		newlyBuiltCatalog = await buildGameCatalog(
			metadataDb,
			dbFileEntryMap,
			(entry) => {
				callback({
					fresh: !currentCatalog,
					message: `Added ${entry.gameName} to catalog`,
				});
			}
		);

		if (catalog) {
			const { updatedAt: _ignored, ...justCatalog } = catalog;
			const { updatedAt: __ignored, ...justNewlyBuiltCatalog } =
				newlyBuiltCatalog!;
			catalogUpdated = !isEqual(justCatalog, justNewlyBuiltCatalog);
			if (catalogUpdated) {
				catalog = newlyBuiltCatalog!;
			}
		} else {
			catalog = newlyBuiltCatalog!;
		}

		let missingRoms: MissingRomEntry[] = [];
		if (downloadRomsSetting) {
			missingRoms = await determineMissingRoms(catalog);
			debug(`missingRoms\n\n${JSON.stringify(missingRoms, null, 2)}`);
		}

		if (missingRoms.length > 0) {
			callback({
				fresh: !currentCatalog,
				message: 'Checking for missing ROMs',
			});
		}
		let romUpdates: Update[] = [];
		if (missingRoms.length > 0) {
			romUpdates = await downloadRoms(missingRoms, (update) => {
				callback({
					fresh: !currentCatalog,
					message: `Downloaded ROM ${update.fileEntry.fileName}`,
				});
			});
		}

		let finalCatalog: Catalog | null = null;
		if (romUpdates.length > 0) {
			catalogUpdated = true;
			callback({
				fresh: !currentCatalog,
				message: 'Adding new ROMs to the catalog',
			});

			finalCatalog = await addMisingRomsToCatalog(romUpdates, catalog);
		} else {
			finalCatalog = catalog;
			finalCatalog.updatedAt = Date.now();
		}

		const catalogPath = path.resolve(gameCacheDir, 'catalog.json');
		await fsp.writeFile(catalogPath, JSON.stringify(finalCatalog, null, 2));

		const allUpdates = updates.concat(romUpdates);
		const message =
			catalogUpdated || allUpdates.length > 0
				? 'Update finished'
				: 'No updates available';

		const duration = Date.now() - start;

		const finalAuditedCatalog = await audit(finalCatalog);

		callback({
			message,
			complete: true,
			catalog: finalAuditedCatalog,
			updates: allUpdates,
			duration,
		});

		_currentCatalog = finalAuditedCatalog;
		return { updates, catalog: finalAuditedCatalog };
	} catch (e) {
		if (e instanceof DownloadRomError) {
			debug('updateCatalog: DownloadRomError', e);
			callback({
				message: e.message,
				error: { type: 'network-error', message: e.message },
			});
		} else if (e instanceof CancelUpdateError) {
			debug('updateCatalog: user canceled');
			callback({
				message: 'Build catalog canceled',
				complete: true,
				canceled: true,
			});
		} else {
			const message = e instanceof Error ? e.message : String(e);
			debug('updateCatalog: unknown error', e);
			callback({
				message: '',
				error: { type: 'unknown', message },
			});
		}

		return FAIL_RETURN;
	}
}

async function hasValidHash(entry: HashedCatalogFileEntry): Promise<boolean> {
	const gameCacheDir = await getGameCacheDir();
	const filePath = path.resolve(gameCacheDir, entry.db_id, entry.relFilePath);
	const data = await fsp.readFile(filePath);
	const md5 = getFileMd5Hash(data);

	return md5 === entry.md5;
}

async function auditCatalogEntry(entry: CatalogEntry): Promise<boolean> {
	let invalid = false;
	const gameCacheDir = await getGameCacheDir();

	const mraPath = path.resolve(
		gameCacheDir,
		entry.db_id,
		entry.files.mra.relFilePath
	);
	const mraExists = await exists(mraPath);

	if (!mraExists) {
		debug('auditCatalogEntry, mra does not exist', mraPath);
		entry.files.mra.status = 'unexpected-missing';
		invalid = true;
	} else if (!(await hasValidHash(entry.files.mra))) {
		entry.files.mra.status = 'corrupt';
		invalid = true;
	}

	if (entry.files.rbf) {
		const rbfPath = path.resolve(
			gameCacheDir,
			entry.db_id,
			entry.files.rbf.relFilePath
		);
		const rbfExists = await exists(rbfPath);

		if (!rbfExists) {
			if (entry.files.rbf.status === 'ok') {
				entry.files.rbf.status = 'unexpected-missing';
				invalid = true;
			}
		} else if (!(await hasValidHash(entry.files.rbf))) {
			entry.files.rbf.status = 'corrupt';
			invalid = true;
		} else {
			entry.files.rbf.status = 'ok';
		}
	}

	entry.files.roms.forEach(async (rom) => {
		const romPath = path.resolve(gameCacheDir, entry.db_id, rom.relFilePath);
		const romExists = await exists(romPath);

		if (!romExists) {
			if (rom.status === 'ok') {
				rom.status = 'unexpected-missing';
				invalid = true;
			}
		} else {
			// we don't check the hash of roms because we never get a reliable
			// hash from anywhere. the db has no rom hashes.
			// TODO: the arcade rom db has hashes
			rom.status = 'ok';
		}
	});

	return invalid;
}

async function audit(catalog: Catalog): Promise<Catalog> {
	debug('audit called');
	const entries = getAllCatalogEntries(catalog);

	debug('about to audit', entries.length, 'entries');
	const auditPromises = entries.map((e) => auditCatalogEntry(e));

	await Promise.all(auditPromises);

	return catalog;
}

async function getCurrentCatalog(): Promise<Catalog | null> {
	if (_currentCatalog) {
		return _currentCatalog;
	}

	const gameCacheDir = await getGameCacheDir();
	const catalogPath = path.resolve(gameCacheDir, 'catalog.json');
	debug(`getCurrentCatalog, catalogPath: ${catalogPath}`);

	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const catalog = require(catalogPath) as Catalog;
		_currentCatalog = catalog;
		return await audit(catalog);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		debug(`getCurrentCatalog error: ${message}`);
		return null;
	}
}

export {
	getDbJson,
	downloadUpdatesForDb,
	buildGameCatalog,
	updateCatalog,
	getCurrentCatalog,
	auditCatalogEntry,
};
