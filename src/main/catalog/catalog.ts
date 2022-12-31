import crypto from 'node:crypto';
import Debug from 'debug';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import { promisify } from 'node:util';
import mkdirp from 'mkdirp';
import { XMLParser } from 'fast-xml-parser';
import _imageSize from 'image-size';

import { downloadFile } from '../util/network';
import { extractZipFileToPath } from '../util/zip';
import {
	Catalog,
	CatalogEntry,
	CatalogFileEntry,
	DBJSON,
	FileEntry,
	MissingRomEntry,
	Update,
	UpdateCallback,
	UpdateReason,
} from './types';
import { getGameCacheDir } from '../util/fs';

const imageSize = promisify(_imageSize);

const DEFAULT_MAME_VERSION = '0245.revival';
const debug = Debug('main/db/db.ts');

const xmlParser = new XMLParser({
	ignoreAttributes: false,
	numberParseOptions: { leadingZeros: false, hex: false },
});

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
		return require(filePath) as DBJSON;
	}

	const extractedJsonPaths = await extractZipFileToPath(filePath);
	return require(extractedJsonPaths[0]) as DBJSON;
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
			db_id: db.db_id,
			type: path.extname(relFilePath).substring(1) as 'mra' | 'rbf',
			relFilePath,
			fileName: path.basename(relFilePath),
			remoteUrl: db.base_files_url + relFilePath,
			hash,
			size,
		};
	});
}

/**
 * Returns the md5 hash of the provided data
 */
function getFileHash(data: Buffer | string): string {
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
		const hash = await getFileHash(fileData);

		debug(
			`determineUpdate for ${fileEntry.fileName}, local hash: ${hash} versus db hash: ${fileEntry.hash}`
		);

		if (hash === fileEntry.hash) {
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
	cb: (update: Update) => void
): Promise<Update[]> {
	const fileEntries = convertDbToFileEntries(db).filter(
		(f) =>
			f.relFilePath.startsWith('_Arcade') &&
			// TODO: deal with alternatives
			!f.relFilePath.includes('_alternatives')
	);

	const updates: Update[] = [];

	for (const fileEntry of fileEntries) {
		const update = await determineUpdate(fileEntry);

		if (update) {
			debug(
				`downloadUpdatesForDb, update for ${fileEntry.fileName}: ${update.updateReason}`
			);
			cb(update);
			await updateFile(update);
			updates.push(update);
		}
	}

	debug('Finished updating for', db.db_id, 'updates.length', updates.length);

	return updates;
}

async function determineOrientation(
	romFile: string
): Promise<'vertical' | 'horizontal' | null> {
	debug(`determineOrientation(${romFile})`);
	const imageUrl = `https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/titles/${romFile}.png`;
	const tmpDir = path.resolve(os.tmpdir(), 'ammister');
	const tmpPath = path.resolve(tmpDir, `orientation-image-${Date.now()}.png`);
	await mkdirp(tmpDir);
	try {
		await downloadFile(imageUrl, tmpPath, 'image/png');
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		debug(
			`determineOrientation(${romFile}): downloadFile failed with: ${message}`
		);
		return null;
	}

	let dimension;
	try {
		dimension = await imageSize(tmpPath);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		debug(
			`determineOrientation(${romFile}): imageSize failed with: ${message}`
		);
		return null;
	}

	if (!dimension || !dimension.width || !dimension.height) {
		debug(
			`determineOrientation(${romFile}): imageSize failed to get the dimensions`
		);
		return null;
	}

	if (dimension.height > dimension.width) {
		return 'vertical';
	}

	return 'horizontal';
}

/**
 * Takes an mra file and parses it to grab its metadata and ultimately
 * form an catalog entry
 */
async function parseMraToCatalogEntry(
	db_id: string,
	mraFilePath: string,
	rbfFiles: string[]
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

		const rbfFilePath = rbfFiles.find((f) => {
			return f.toLowerCase().includes(`cores/${rbf.toLowerCase()}`);
		});

		const rbfData = rbfFilePath ? await fsp.readFile(rbfFilePath!) : null;

		const manufacturerA = Array.isArray(manufacturer)
			? manufacturer
			: [manufacturer];

		const romEntries = Array.isArray(rom) ? rom : [rom];
		const romEntryWithZip = romEntries.find((r: any) => !!r['@_zip']);
		const romFile =
			romEntryWithZip?.['@_zip']?.replaceAll('.zip', '') ||
			setname ||
			parent ||
			rbf;

		if (!romFile) {
			debug(`parseMraToCatalogEntry, failed to determine rom for ${name}`);
		}

		let romSlug;
		let romData = null;
		for (const r of romFile.split('|')) {
			try {
				romData = await fsp.readFile(
					path.resolve(gameCacheDir, db_id, 'games', 'mame', r + '.zip')
				);
				romSlug = r;
				break;
			} catch (e) {}
		}

		const romEntry: CatalogFileEntry | undefined = !romData
			? undefined
			: {
					db_id,
					type: 'rom',
					fileName: `${romSlug}.zip`,
					relFilePath: `games/mame/${romSlug}.zip`,
					hash: getFileHash(romData),
					size: romData.byteLength,
			  };

		const catalogEntry: CatalogEntry = {
			db_id,
			gameName: name,
			manufacturer: manufacturerA,
			yearReleased: Number(year),
			category: category ?? null,
			orientation: romSlug ? await determineOrientation(romSlug) : null,
			rom: romFile,
			mameVersion: mameversion,
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
					hash: getFileHash(mraData),
					size: mraData.length,
				},
			},
		};

		if (romEntry) {
			catalogEntry.files.rom = romEntry;
		}

		if (rbfData && rbfFilePath) {
			catalogEntry.files.rbf = {
				db_id,
				type: 'rbf',
				fileName: path.basename(rbfFilePath),
				relFilePath: rbfFilePath.substring(rbfFilePath.indexOf('_Arcade')),
				hash: getFileHash(rbfData),
				size: rbfData.byteLength,
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
async function getCatalogForDir(dbDirPath: string): Promise<Partial<Catalog>> {
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
		return parseMraToCatalogEntry(dbId, mraPath, rbfFiles);
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
async function buildGameCatalog(): Promise<Catalog> {
	const gameCacheDir = await getGameCacheDir();

	const gameCacheDirFiles = await fsp.readdir(gameCacheDir);
	const dbIdDirs = gameCacheDirFiles.filter((gcFile) => {
		return fs.statSync(path.resolve(gameCacheDir, gcFile)).isDirectory();
	});

	const dirCatalogPromises = dbIdDirs.map((dbIdDir) => {
		return getCatalogForDir(path.resolve(gameCacheDir, dbIdDir));
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

const dbs: Record<string, string> = {
	distribution_mister:
		'https://raw.githubusercontent.com/MiSTer-devel/Distribution_MiSTer/main/db.json.zip',
	jtcores:
		'https://raw.githubusercontent.com/jotego/jtcores_mister/main/jtbindb.json.zip',
	theypsilon_unofficial_distribution:
		'https://raw.githubusercontent.com/theypsilon/Distribution_Unofficial_MiSTer/main/unofficialdb.json.zip',
};

async function determineMissingRoms(
	catalog: Catalog
): Promise<MissingRomEntry[]> {
	const { updatedAt, ...restofCatalog } = catalog;
	const catalogEntries = Object.values(restofCatalog).reduce<CatalogEntry[]>(
		(accum, entries) => {
			return accum.concat(entries);
		},
		[]
	);

	const entriesMissingTheirRom = catalogEntries.filter((ce) => !ce.files.rom);

	return entriesMissingTheirRom.map<MissingRomEntry>((ce) => {
		const mre: MissingRomEntry = {
			db_id: ce.db_id,
			romFiles: ce.rom
				.split('|')
				.map((r) => r.toLowerCase().replace('.zip', '')),
			mameVersion: ce.mameVersion,
		};

		return mre;
	});
}

async function downloadRom(
	romEntry: MissingRomEntry,
	overrideMameVersion?: string
): Promise<Update | null> {
	debug(
		`downloadRom, getting ${romEntry.romFiles.join('|')} with mameVersion ${
			overrideMameVersion || romEntry.mameVersion
		}`
	);
	const gameCacheDir = await getGameCacheDir();

	for (const romFile of romEntry.romFiles) {
		if (romFile.toLowerCase().includes('.zip')) {
			throw new Error('MissingRomEntry has bad romFile name: ' + romFile);
		}

		const mameVersionToUse =
			overrideMameVersion || romEntry.mameVersion || DEFAULT_MAME_VERSION;
		const remoteUrl = `https://archive.org/download/mame.${mameVersionToUse}/${romFile}.zip`;

		try {
			const fileName = path.basename(remoteUrl);
			const relFilePath = `games/mame/${fileName}`;
			const localPath = path.resolve(gameCacheDir, romEntry.db_id, relFilePath);

			let updateReason: UpdateReason;
			let romData;

			try {
				romData = await fsp.readFile(localPath);
				updateReason = 'fulfilled';
			} catch (e) {
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
					hash: getFileHash(romData),
					size: romData.byteLength,
				},
				updateReason,
			};
		} catch (e) {
			// @ts-expect-error
			debug(`downloadRom, error`, e.message);
		}
	}

	return null;
}

async function downloadRoms(
	romEntries: MissingRomEntry[],
	cb: (update: Update) => void
): Promise<Update[]> {
	const updates: Update[] = [];

	for (const romEntry of romEntries) {
		const update =
			(await downloadRom(romEntry)) ??
			(await downloadRom(romEntry, DEFAULT_MAME_VERSION));

		// we will quietly ignore fulfilled updates as the user doesn't need to know
		if (update && update.updateReason !== 'fulfilled') {
			updates.push(update);
			cb(update);
		} else {
			debug(`downloadRoms: failed to download ${romEntry.romFiles.join('|')}`);
			// TODO: updates should support errors for repoting
		}
	}

	return updates;
}

function addMisingRomsToCatalog(
	romUpdates: Update[],
	catalog: Catalog
): Catalog {
	for (const romUpdate of romUpdates) {
		const db = catalog[romUpdate.fileEntry.db_id];
		const gameEntry = db.find((ce) => {
			const allRoms = ce.rom.split('|');
			return allRoms.some((r) =>
				romUpdate.fileEntry.relFilePath.toLowerCase().includes(r.toLowerCase())
			);
		});

		gameEntry!.files.rom = romUpdate.fileEntry;
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
	const gameCacheDir = await getGameCacheDir();
	await mkdirp(gameCacheDir);

	const updates: Update[] = [];

	const callback: UpdateCallback = (args) => {
		debug(args.message);
		providedCallback(args);
	};

	for (const [dbId, dbUrl] of Object.entries(dbs)) {
		callback({ message: `Checking for anything new in ${dbId}` });

		const dbResult = await getDbJson(dbUrl);
		const dbUpdates = await downloadUpdatesForDb(dbResult, (update) => {
			const verb: Record<UpdateReason, string> = {
				missing: 'Dowloading',
				updated: 'Updating',
				corrupt: 'Fixing',
				fulfilled: '',
			};

			callback({
				message: `${verb[update.updateReason]} ${update.fileEntry.fileName}`,
			});
		});
		updates.push(...dbUpdates);
	}

	const currentCatalog = await getCurrentCatalog();
	let catalogUpdated = false;
	let catalog;

	// nothing to update and we already have a catalog from a previous run?
	// then just use it. If we have no catalog, we'll build a new one despite the lack of updates
	if (updates.length === 0 && currentCatalog) {
		catalog = currentCatalog;
	}

	if (!catalog) {
		catalogUpdated = true;
		callback({ message: 'Building catalog...' });
		catalog = await buildGameCatalog();
	}

	const missingRoms = await determineMissingRoms(catalog);
	debug(`missingRoms\n\n${JSON.stringify(missingRoms, null, 2)}`);

	const romUpdates = await downloadRoms(missingRoms, (update) => {
		callback({ message: `Downloaded ROM ${update.fileEntry.fileName}` });
	});

	let finalCatalog;
	if (romUpdates.length > 0) {
		catalogUpdated = true;
		callback({ message: 'Adding new ROMs to the catalog' });
		finalCatalog = await addMisingRomsToCatalog(romUpdates, catalog);
	} else {
		finalCatalog = catalog;
		finalCatalog.updatedAt = Date.now();
	}

	const catalogPath = path.resolve(gameCacheDir, 'catalog.json');
	await fsp.writeFile(catalogPath, JSON.stringify(finalCatalog, null, 2));

	const message = catalogUpdated ? 'Update finished' : 'No updates available';

	callback({
		message,
		complete: true,
		catalog: finalCatalog,
		updates: updates.concat(romUpdates),
	});

	return { updates, catalog: finalCatalog };
}

async function getCurrentCatalog(): Promise<Catalog | null> {
	const gameCacheDir = await getGameCacheDir();
	const catalogPath = path.resolve(gameCacheDir, 'catalog.json');
	debug(`getCurrentCatalog, catalogPath: ${catalogPath}`);

	try {
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

	if (typeof ce.rom !== 'string') {
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
