import crypto from 'node:crypto';
import Debug from 'debug';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import mkdirp from 'mkdirp';
import { XMLParser } from 'fast-xml-parser';
import { JsonCache } from '../util/JsonCache';
import uniqBy from 'lodash/uniqBy';

import { downloadFile } from '../util/network';
import { extractZipFileToPath } from '../util/zip';
import {
	Catalog,
	CatalogEntry,
	CatalogFileEntry,
	DBJSON,
	FileEntry,
	GameMetadata,
	MetadataDB,
	MissingRomEntry,
	Update,
	UpdateCallback,
	UpdateReason,
} from './types';
import { UpdateDbConfig } from '../settings/types';
import { convertFileNameDate, getGameCacheDir } from '../util/fs';
import { isEqual } from 'lodash';
import { batch } from '../util/batch';
import { slugMap } from './slugMap';
import * as settings from '../settings';

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
function convertDbToFileEntries(db: DBJSON): FileEntry[] {
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

/**
 * Given a FileEntry just pulled from a db file, determines what kind of
 * update is needed to make sure AMMister's gameCache has the latest version
 */
async function determineUpdate(fileEntry: FileEntry): Promise<Update | null> {
	const gameCacheDir = await getGameCacheDir();
	const fullPath = path.resolve(
		gameCacheDir,
		fileEntry.db_id,
		fileEntry.relFilePath
	);

	debug(`determineUpdate, full path: ${fullPath}`);

	try {
		const fileData = await fsp.readFile(fullPath);
		const md5 = await getFileMd5Hash(fileData);

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
		if (e instanceof Error && 'code' in e && e.code === 'ENOENT') {
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
	db: DBJSON,
	cb: (err: null | string, update: Update) => boolean
): Promise<Update[]> {
	const fileEntries = convertDbToFileEntries(db).filter(
		(f) =>
			f.relFilePath.startsWith('_Arcade') &&
			// TODO: deal with alternatives
			!f.relFilePath.includes('_alternatives')
	);

	const updates: Update[] = [];

	const batches = batch(fileEntries);

	let proceeding = true;

	for (const batch of batches) {
		const batchPromises = batch.map(async (fileEntry) => {
			const update = await determineUpdate(fileEntry);

			if (update) {
				const cbProceeding = cb(null, update);

				if (!cbProceeding && proceeding) {
					debug('downloadUpdatesForDb, user canceled');
				}
				proceeding = proceeding && cbProceeding;
				if (proceeding) {
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
			}
		});

		await Promise.all(batchPromises);
	}

	debug('Finished updating for', db.db_id, 'updates.length', updates.length);

	return updates;
}

function determineMAMESlug(
	romEntries: CatalogFileEntry[],
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

/**
 * Given all of the local rbf files, finds the one that matches and is the most recent version
 * in the case of there being multiple
 */
function getBestRbfPath(rbfPaths: string[], rbfName: string): string | null {
	const matchingRbfPaths = rbfPaths.filter((f) =>
		// join is important here to avoid platform specific issues, on Windows
		// the path seperator is different
		f.toLowerCase().includes(path.join('cores', rbfName.toLowerCase()))
	);

	if (matchingRbfPaths.length === 0) {
		return null;
	}

	return matchingRbfPaths.reduce((champ, contender) => {
		const champDate = convertFileNameDate(path.basename(champ));
		const contenderDate = convertFileNameDate(path.basename(contender));

		if (!champDate) {
			return contender;
		}

		if (!contenderDate) {
			return champ;
		}

		if (champDate.getTime() > contenderDate.getTime()) {
			return champ;
		} else {
			return contender;
		}
	});
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
	mraFilePath: string,
	rbfFiles: string[],
	metadataDb: MetadataDB
): Promise<CatalogEntry> {
	try {
		const gameCacheDir = await getGameCacheDir();
		const mraData = (await fsp.readFile(mraFilePath)).toString();

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

		const rbfFilePath = getBestRbfPath(rbfFiles, rbf);

		const rbfData = rbfFilePath ? await fsp.readFile(rbfFilePath!) : null;

		const romEntries = Array.isArray(rom) ? rom : [rom];
		const romEntryWithZip = romEntries.find(
			(r: { '@_zip'?: string }) => !!r['@_zip']
		);
		const romFile = romEntryWithZip?.['@_zip'];

		if (!romFile) {
			debug(`parseMraToCatalogEntry, ${name} has no rom zip specified`);
		}

		const romCatalogFileEntries: CatalogFileEntry[] = [];
		if (romFile) {
			for (const r of romFile.split('|')) {
				let rData;
				try {
					rData = await fsp.readFile(
						path.resolve(gameCacheDir, db_id, 'games', 'mame', r)
					);
				} catch (e) {
					rData = null;
				}

				romCatalogFileEntries.push({
					db_id,
					fileName: r,
					// path.join is used to account for OS specific path separators
					relFilePath: path.join('games', 'mame', r),
					type: 'rom',
					md5: rData ? getFileMd5Hash(rData) : undefined,
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
					fileName: path.basename(mraFilePath),
					relFilePath: mraFilePath.substring(mraFilePath.indexOf('_Arcade')),
					md5: getFileMd5Hash(mraData),
				},
				roms: romCatalogFileEntries,
			},
		};

		if (rbfData && rbfFilePath) {
			catalogEntry.files.rbf = {
				db_id,
				type: 'rbf',
				fileName: path.basename(rbfFilePath),
				relFilePath: rbfFilePath.substring(rbfFilePath.indexOf('_Arcade')),
				md5: getFileMd5Hash(rbfData),
			};
		}

		return catalogEntry;
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		debug(`parseMraToCatalogEntry error for ${mraFilePath}: ${message}`);
		throw e;
	}
}

/**
 * For a directory where a db's files have been dumped into, creates
 * an AMMister catalog for it
 */
async function getCatalogForDir(
	dbDirPath: string,
	metadataDb: MetadataDB
): Promise<Partial<Catalog>> {
	const dbId = path.basename(dbDirPath);
	const mraFiles = await (
		await fsp.readdir(path.resolve(dbDirPath, '_Arcade'))
	).flatMap((f) => {
		if (f.endsWith('.mra')) {
			return [path.resolve(dbDirPath, '_Arcade', f)];
		} else {
			return [];
		}
	});

	const rbfFiles = await (
		await fsp.readdir(path.resolve(dbDirPath, '_Arcade', 'cores'))
	).flatMap((f) => {
		if (f.endsWith('.rbf')) {
			return [path.resolve(dbDirPath, '_Arcade', 'cores', f)];
		} else {
			return [];
		}
	});

	const entryPromises = mraFiles.map(async (mraPath) => {
		return parseMraToCatalogEntry(dbId, mraPath, rbfFiles, metadataDb);
	});

	const entries = await Promise.all(entryPromises);

	return {
		[dbId]: entries,
	};
}

/**
 * Examines all the files found in gameCache and builds an AMMister
 * Catalog for it
 */
async function buildGameCatalog(metadataDb: MetadataDB): Promise<Catalog> {
	const gameCacheDir = await getGameCacheDir();

	const gameCacheDirFiles = await fsp.readdir(gameCacheDir);
	const dbIdDirs = gameCacheDirFiles.filter((gcFile) => {
		return fs.statSync(path.resolve(gameCacheDir, gcFile)).isDirectory();
	});

	const dirCatalogPromises = dbIdDirs.map((dbIdDir) => {
		return getCatalogForDir(path.resolve(gameCacheDir, dbIdDir), metadataDb);
	});

	const dirCatalogs = await Promise.all(dirCatalogPromises);

	const catalog = dirCatalogs.reduce<Partial<Catalog>>((accum, entry) => {
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
		ce.files.roms?.some((r) => !r.md5)
	);

	return entriesMissingTheirRom.flatMap<MissingRomEntry>((ce) => {
		return ce.files.roms
			.filter((r) => !r.md5)
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
		let romData;

		try {
			romData = await fsp.readFile(localPath);
			updateReason = 'fulfilled';
		} catch (e) {
			const cached404 = archive404Cache.get(remoteUrl);

			if (cached404) {
				debug(`downloadRom: cache has ${remoteUrl} as a 404`);
				return null;
			}

			debug(`downloadRom, downloading from: ${remoteUrl}\n to: ${localPath}`);
			await downloadFile(remoteUrl, localPath, 'application/zip');
			romData = await fsp.readFile(localPath);
			updateReason = 'missing';
		}

		return {
			fileEntry: {
				db_id: romEntry.db_id,
				type: 'rom',
				relFilePath,
				fileName,
				remoteUrl,
				md5: getFileMd5Hash(romData),
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
	cb: (err: string | null, rom: Update | null) => boolean
): Promise<Update[]> {
	const allRomUpdates: Update[] = [];

	const uniqueRomEntries = uniqBy(romEntries, JSON.stringify);
	const sortedRomEntries = uniqueRomEntries.sort((a, b) => {
		return a.romFile.localeCompare(b.romFile);
	});

	const batches = batch(sortedRomEntries);

	let proceeding = true;

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
				proceeding = proceeding && cb(null, update);
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			proceeding = proceeding && cb(message, null);
		}

		if (!proceeding) {
			break;
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
					r.md5 = romUpdate.fileEntry.md5;
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

	let proceeding = true;

	const downloadRomsSetting = await settings.getSetting('downloadRoms');
	const updateDbs = await settings.getSetting<UpdateDbConfig[]>('updateDbs');
	const enabledUpdateDbs = updateDbs.filter((db) => db.enabled);

	const callback: UpdateCallback = (args) => {
		debug(args.message);
		proceeding = providedCallback(args);
		return proceeding;
	};

	const FAIL_RETURN: { updates: Update[]; catalog: Catalog } = {
		updates: [],
		// @ts-expect-error
		catalog: { updatedAt: Date.now() },
	};

	try {
		const gameCacheDir = await getGameCacheDir();
		await mkdirp(gameCacheDir);

		await archive404Cache.init();

		const updates: Update[] = [];

		const currentCatalog = await getCurrentCatalog();

		callback({
			fresh: !currentCatalog,
			message: 'Getting the latest MiSTer Arcade Database...',
		});

		const metadataDb = await getMetadataDb();

		let updateDbErrorOccurred = false;

		for (const updateDb of enabledUpdateDbs) {
			if (!proceeding) {
				break;
			}

			callback({
				fresh: !currentCatalog,
				message: `Checking for anything new in ${updateDb.displayName}`,
			});

			const dbResult = await getDbJson(updateDb.url);

			const dbUpdates = await downloadUpdatesForDb(dbResult, (err, update) => {
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

				return proceeding;
			});

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
		if (proceeding) {
			callback({
				fresh: !currentCatalog,
				message: 'Building catalog...',
			});
			newlyBuiltCatalog = await buildGameCatalog(metadataDb);
		}

		if (proceeding && catalog) {
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
		if (proceeding && downloadRomsSetting) {
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
		let downloadRomErrorOccured = false;
		if (proceeding && missingRoms.length > 0) {
			romUpdates = await downloadRoms(missingRoms, (err, update) => {
				if (err) {
					downloadRomErrorOccured = true;
					callback({
						message: err,
						error: { type: 'network-error', message: err },
					});
					return false;
				} else {
					callback({
						fresh: !currentCatalog,
						message: `Downloaded ROM ${update!.fileEntry.fileName}`,
					});
				}

				return proceeding;
			});
		}

		if (downloadRomErrorOccured) {
			return FAIL_RETURN;
		}

		let finalCatalog: Catalog | null = null;
		if (proceeding) {
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
		}

		if (proceeding) {
			const catalogPath = path.resolve(gameCacheDir, 'catalog.json');
			await fsp.writeFile(catalogPath, JSON.stringify(finalCatalog, null, 2));

			const message = catalogUpdated
				? 'Update finished'
				: 'No updates available';

			const duration = Date.now() - start;

			callback({
				message,
				complete: true,
				catalog: finalCatalog!,
				updates: updates.concat(romUpdates),
				duration,
			});

			return { updates, catalog: finalCatalog! };
		} else {
			callback({
				message: 'Build catalog canceled',
				complete: true,
				canceled: true,
			});

			return FAIL_RETURN;
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		debug('updateCatalog: unknown error', e);
		callback({
			message: '',
			error: { type: 'unknown', message },
		});

		return FAIL_RETURN;
	} finally {
		await archive404Cache.save();
	}
}

async function getCurrentCatalog(): Promise<Catalog | null> {
	const gameCacheDir = await getGameCacheDir();
	const catalogPath = path.resolve(gameCacheDir, 'catalog.json');
	debug(`getCurrentCatalog, catalogPath: ${catalogPath}`);

	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return require(catalogPath) as Catalog;
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		debug(`getCurrentCatalog error: ${message}`);
		return null;
	}
}

function isCatalogEntry(obj: unknown): obj is CatalogEntry {
	if (!obj) {
		return false;
	}

	const ce = obj as CatalogEntry;

	if (typeof ce.db_id !== 'string') {
		return false;
	}

	if (typeof ce.gameName !== 'string') {
		return false;
	}

	return true;
}

export {
	getDbJson,
	downloadUpdatesForDb,
	buildGameCatalog,
	updateCatalog,
	getCurrentCatalog,
	isCatalogEntry,
};
