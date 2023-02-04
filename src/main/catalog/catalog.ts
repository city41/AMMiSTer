import crypto from 'node:crypto';
import Debug from 'debug';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import mkdirp from 'mkdirp';
import { XMLParser } from 'fast-xml-parser';
import { JsonCache } from '../util/JsonCache';
import uniqBy from 'lodash/uniqBy';

import { downloadFile } from '../util/network';
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
import { exists, getGameCacheDir } from '../util/fs';
import isEqual from 'lodash/isEqual';
import { batch } from '../util/batch';
import { slugMap } from './slugMap';
import * as settings from '../settings';

let _currentCatalog: Catalog | null = null;

class CancelUpdateError extends Error {}
class DownloadRomError extends Error {}

const DEFAULT_MAME_VERSION = '0245.revival';
const debug = Debug('main/db/db.ts');

const xmlParser = new XMLParser({
	ignoreAttributes: false,
	numberParseOptions: { leadingZeros: false, hex: false },
});

const archive404Cache = new JsonCache<boolean>('archive404.json');

const METADATADB_URL =
	'https://raw.githubusercontent.com/Toryalai1/MiSTer_ArcadeDatabase/db/mad_db.json.zip';

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
	const warningTxt = `AMMiSTER gameCacheWarning
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

function cleanDbId(db_id: string): string {
	return db_id.replace(/\//g, '_').replace(/\\/g, '_');
}

/**
 * Takes a db as pulled from the internet and converts it
 * into FileEntrys for easier processing
 */
function convertDbToFileEntries(db: DBJSON): HashedFileEntry[] {
	const entries = Object.entries(db.files);

	return entries.map((e) => {
		const relFilePath = e[0];
		const { hash, size } = e[1];

		return {
			db_id: cleanDbId(db.db_id),
			type: path.extname(relFilePath).substring(1) as 'mra' | 'rbf',
			relFilePath,
			fileName: path.basename(relFilePath),
			remoteUrl: db.base_files_url + relFilePath,
			md5: hash,
			size,
		};
	});
}

/**
 * Returns the md5 hash of the provided data
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
					cb(message, update);
					throw e;
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

function xmlToArray(val: string | string[] | null | undefined): string[] {
	if (!val) {
		return [];
	}

	if (Array.isArray(val)) {
		return val.filter((v) => !v);
	}

	return [val];
}

/**
 * Takes an mra file and parses it to grab its metadata and ultimately
 * form an catalog entry
 */
async function parseMraToCatalogEntry(
	db_id: string,
	mraFileEntry: HashedFileEntry,
	fileEntries: HashedFileEntry[],
	metadataDb: MetadataDB
): Promise<CatalogEntry> {
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
			year,
			rom,
			mameversion = DEFAULT_MAME_VERSION,
			rbf,
			setname,
			parent,
			category,
		} = parsed.misterromdescription;

		const rbfFileEntry = fileEntries.find(
			(fe) =>
				fe.type === 'rbf' &&
				fe.relFilePath
					.toLowerCase()
					.startsWith(path.join('_Arcade', 'cores', rbf).toLowerCase())
		);

		const romEntries = Array.isArray(rom) ? rom : [rom];
		const romEntryWithZip = romEntries.find(
			(r: { '@_zip'?: string }) => !!r['@_zip']
		);
		const romFile = romEntryWithZip?.['@_zip'];

		if (!romFile) {
			debug(`parseMraToCatalogEntry, ${name} has no rom zip specified`);
		}

		const romCatalogFileEntries: NonHashedCatalogFileEntry[] = [];

		if (romFile) {
			for (const r of romFile.split('|')) {
				const romExists = await exists(
					path.resolve(gameCacheDir, db_id, 'games', 'mame', r)
				);

				romCatalogFileEntries.push({
					db_id,
					fileName: r,
					// path.join is used to account for OS specific path separators
					relFilePath: path.join('games', 'mame', r),
					type: 'rom',
					status: romExists ? 'ok' : 'missing',
				});
			}
		}

		const romSlug = determineMAMESlug(romCatalogFileEntries, setname || parent);

		let yearReleased: number | null = parseInt(year, 10);
		if (isNaN(yearReleased)) {
			yearReleased = null;
		}

		const metadataEntry = (
			romSlug ? metadataDb[romSlug] ?? {} : {}
		) as Partial<GameMetadata>;

		const catalogEntry: CatalogEntry = {
			db_id,
			gameName: name,
			romSlug: romSlug ?? null,
			manufacturer: xmlToArray(manufacturer),
			yearReleased,
			categories: xmlToArray(category),
			mameVersion: mameversion,
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
			titleScreenshotUrl: romSlug
				? `https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/titles/${romSlug}.png`
				: null,
			gameplayScreenshotUrl: romSlug
				? `https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/snap/${romSlug}.png`
				: null,
			files: {
				mra: {
					db_id,
					type: 'mra',
					fileName: path.basename(mraAbsFilePath),
					relFilePath: mraAbsFilePath.substring(
						mraAbsFilePath.indexOf('_Arcade')
					),
					md5: mraFileEntry.md5,
					status: 'ok',
				},
				roms: romCatalogFileEntries,
			},
		};

		if (rbfFileEntry) {
			catalogEntry.files.rbf = {
				db_id,
				type: 'rbf',
				fileName: path.basename(rbfFileEntry.relFilePath),
				relFilePath: rbfFileEntry.relFilePath,
				md5: rbfFileEntry.md5,
				status: 'ok',
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
		cb(catalogEntry);
		return catalogEntry;
	});

	const catalogEntries = await Promise.all(catalogEntryPromises);

	return {
		[db_id]: catalogEntries,
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

async function determineMissingRoms(
	catalog: Catalog
): Promise<MissingRomEntry[]> {
	const { updatedAt, ...restofCatalog } = catalog;
	const catalogEntries = Object.values(restofCatalog).flat(1);

	const entriesMissingTheirRom = catalogEntries.filter((ce) =>
		ce.files.roms?.some(
			(r) => r.status === 'missing' || r.status === 'unexpected-missing'
		)
	);

	return entriesMissingTheirRom.flatMap<MissingRomEntry>((ce) => {
		return ce.files.roms
			.filter((r) => r.status !== 'ok')
			.map((r) => {
				return {
					db_id: ce.db_id,
					romFile: r.fileName,
					mameVersion: ce.mameVersion,
				};
			});
	});
}

async function downloadRom(
	romEntry: MissingRomEntry,
	overrideMameVersion?: string
): Promise<Update | null> {
	const gameCacheDir = await getGameCacheDir();

	const mameVersionToUse =
		overrideMameVersion || romEntry.mameVersion || DEFAULT_MAME_VERSION;

	debug(
		`downloadRom, getting ${romEntry.romFile} with mameVersion ${mameVersionToUse}`
	);
	const remoteUrl = `https://archive.org/download/mame.${mameVersionToUse}/${romEntry.romFile}`;

	try {
		const fileName = path.basename(remoteUrl);
		// path.join is used to account for OS specific path separators
		const relFilePath = path.join('games', 'mame', fileName);
		const localPath = path.resolve(gameCacheDir, romEntry.db_id, relFilePath);

		let updateReason: UpdateReason;

		try {
			await fsp.readFile(localPath);
			updateReason = 'fulfilled';
		} catch (e) {
			const cached404 = archive404Cache.get(remoteUrl);

			if (cached404) {
				debug(`downloadRom: cache has ${remoteUrl} as a 404`);
				return null;
			}

			debug(`downloadRom, downloading from: ${remoteUrl}\n to: ${localPath}`);
			await downloadFile(remoteUrl, localPath, 'application/zip');
			updateReason = 'missing';
		}

		return {
			fileEntry: {
				db_id: romEntry.db_id,
				type: 'rom',
				relFilePath,
				fileName,
				remoteUrl,
			},
			updateReason,
		};
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);

		// TODO: stronger 404 signal
		// some roms also 403 (forbidden), and in this context is essentially a 404
		if (
			message.includes('status code 404') ||
			message.includes('status code 403')
		) {
			debug('downloadRom, adding 404 to cache for', remoteUrl);
			archive404Cache.set(remoteUrl, true);
		} else {
			debug('downloadRom, error', remoteUrl, message);
			throw `${remoteUrl}: ${message}`;
		}
	}

	return null;
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
		const downloadPromises = batch.map((r) => {
			return downloadRom(r).then((result) => {
				if (result === null) {
					return downloadRom(r, DEFAULT_MAME_VERSION);
				} else {
					return result;
				}
			});
		});

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
	const enabledUpdateDbs = updateDbs.filter((db) => db.enabled);

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

		await archive404Cache.init();

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
					!f.relFilePath.includes('_alternatives')
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
							missing: 'Dowloading',
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
	} finally {
		await archive404Cache.save();
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
			rom.status = 'ok';
		}
	});

	return invalid;
}

async function audit(catalog: Catalog): Promise<Catalog> {
	const { updatedAt, ...restOfCatalog } = catalog;
	const entries = Object.values(restOfCatalog).flat(1);

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
