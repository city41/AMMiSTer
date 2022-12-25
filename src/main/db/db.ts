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

const GAME_CACHE_DIR = 'gameCache';
const debug = Debug('main/db/db.ts');

const xmlParser = new XMLParser({ ignoreAttributes: false });

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
async function getUpdateJson(url: string): Promise<DBJSON> {
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

function filterToGameEntries(fileEntries: FileEntry[]): FileEntry[] {
	return fileEntries.filter((fileEntry) => {
		return fileEntry.relFilePath.startsWith('_Arcade');
	});
}

function getFileHash(data: Buffer | string): string {
	return crypto.createHash('md5').update(data).digest('hex');
}

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

async function downloadUpdatesForDb(db: DBJSON): Promise<Update[]> {
	const fileEntries = filterToGameEntries(convertDbToFileEntries(db));

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

export { getUpdateJson, downloadUpdatesForDb, buildGameCatalog };
