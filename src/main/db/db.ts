import crypto from 'node:crypto';
import Debug from 'debug';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import mkdirp from 'mkdirp';
import settings from 'electron-settings';
import { XMLParser } from 'fast-xml-parser';

import { downloadFile } from '../util/network';
import { extractZipFileToPath } from '../util/zip';
import { Catalog, CatalogEntry, DBJSON, FileEntry, Update } from './types';

/**
 * Located at settings.get('rootDir'), this is the root
 * dir of all local AMMister game files
 */
const GAME_CACHE_DIR = 'gameCache';
const debug = Debug('main/db/db.ts');

const xmlParser = new XMLParser({ ignoreAttributes: false });

/**
 * Returns the root directory of the game cache, or throws
 * if called before it has been established
 */
async function getGameCacheDir(): Promise<string> {
	const rootDir = await settings.get('rootDir');

	if (!rootDir) {
		throw new Error('db#getGameCacheDir: rootDir is not set in settings');
	}

	return path.resolve(rootDir.toString(), GAME_CACHE_DIR);
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
	const fullPath = path.resolve(gameCacheDir, fileEntry.relFilePath);

	try {
		const fileData = await fsp.readFile(fullPath);
		const hash = await getFileHash(fileData);

		if (hash === fileEntry.hash) {
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
async function downloadUpdatesForDb(db: DBJSON): Promise<Update[]> {
	const fileEntries = convertDbToFileEntries(db).filter((f) =>
		f.relFilePath.startsWith('_Arcade')
	);

	const updates: Update[] = [];

	for (const fileEntry of fileEntries) {
		const update = await determineUpdate(fileEntry);

		if (update) {
			await updateFile(update);
			updates.push(update);
		}
	}

	debug('Finished updating for', db.db_id, 'updates.length', updates.length);

	return updates;
}

/**
 * Takes an mra file and parses it to grab its metadata and ultimately
 * form an catalog entry
 */
async function parseMraToCatalogEntry(
	db_id: string,
	mraFilePath: string
): Promise<CatalogEntry> {
	const data = (await fsp.readFile(mraFilePath)).toString();

	const parsed = xmlParser.parse(data);
	const { name, manufacturer, year, rom } = parsed.misterromdescription;

	const manufacturerA = Array.isArray(manufacturer)
		? manufacturer
		: [manufacturer];

	const romEntries = Array.isArray(rom) ? rom : [rom];
	const romEntryWithZip = romEntries.find((r: any) => !!r['@_zip']);
	const romFile = romEntryWithZip?.['@_zip']?.replace('.zip', '') ?? '';

	return {
		db_id,
		gameName: name,
		manufacturer: manufacturerA,
		yearReleased: Number(year),
		orientation: 'horizontal',
		rom: romFile,
		titleScreenshotUrl: `https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/title/${romFile}.png`,
		gameplayScreenshotUrl: `https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/snap/${romFile}.png`,
		files: {
			mra: {
				db_id,
				type: 'mra',
				fileName: path.basename(mraFilePath),
				relFilePath: mraFilePath.substring(mraFilePath.indexOf('_Arcade')),
				hash: getFileHash(data),
				size: data.length,
			},
		},
	};
}

/**
 * For a directory where a db's files have been dumped into, creates
 * an AMMister catalog for it
 */
async function getCatalogForDir(dbDirPath: string): Promise<Catalog> {
	const dbId = path.basename(dbDirPath);
	const mras = (await fsp.readdir(path.resolve(dbDirPath, '_Arcade'))).filter(
		(f) => {
			return f.toLowerCase().endsWith('mra');
		}
	);

	const entryPromises = mras.map(async (mraFile) => {
		const mraPath = path.resolve(dbDirPath, '_Arcade', mraFile);
		return parseMraToCatalogEntry(dbId, mraPath);
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

	const catalog = dirCatalogs.reduce<Catalog>((accum, entry) => {
		return {
			...accum,
			...entry,
		};
	}, {});

	return catalog;
}

export { getDbJson, downloadUpdatesForDb, buildGameCatalog };
