import path from '../util/universalPath';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import Debug from 'debug';
import winston from 'winston';
import uniqBy from 'lodash/uniqBy';

import * as settings from '../settings';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
	PlanGameEntry,
} from '../plan/types';
import {
	SrcFileOperationPath,
	DestFileOperationPath,
	FileOperation,
	FileClientConnectConfig,
	ExportCallback,
	SrcExactFileOperationPath,
	SrcDatedFilenameFileOperationPath,
	DestExactFileOperationPath,
	DestDatedFilenameFileOperationPath,
	FileClient,
} from './types';
import { FTPFileClient } from './FTPFileClient';
import { convertFileNameDate, getGameCacheDir } from '../util/fs';
import { Catalog, CatalogEntry } from '../catalog/types';
import { LocalFileClient } from './LocalFileClient';
import { ExportOptimization, UpdateDbConfig } from '../settings/types';
import { getCurrentCatalog } from '../catalog';
import { isPlanGameEntry } from '../plan';
import {
	getAllCatalogEntries,
	getCatalogEntryForMraPath,
} from '../catalog/util';
import { getDatedFilenamePathComponents } from '../util/getDatedFilenamePathComponents';

const debug = Debug('main/export/export.ts');

class CancelExportError extends Error {}

let exportLogger: winston.Logger;

/**
 * Winston logs are a stream of JSON objects. Many JSON viewers don't
 * handle this very well. Turning that stream into a JSON array helps.
 * This allows loading an ammister export log into say the JSON Formatter
 * Chrome extension, which makes looking over it much easier.
 */
async function turnLogIntoArray(logFilePath: string): Promise<void> {
	const contents = (await fsp.readFile(logFilePath)).toString();
	const entries = contents.split('\n').filter((e) => !!e);
	const arrayedContents = `[ ${entries.join(',')} ]`;
	return fsp.writeFile(logFilePath, arrayedContents);
}

async function createExportLogger(planName: string, initiator: string) {
	const rootDir = await settings.getSetting('rootDir');
	const logFileName =
		// Convert spaces to underscores, remove colons (which are not legal in Windows file names)
		`export-log--${initiator}-${planName}-${new Date().toISOString()}.json`.replace(
			/[\s:]/g,
			'_'
		);

	const logFilePath = path.resolve((rootDir ?? '').toString(), logFileName);
	debug('createExportLogger, path:', logFilePath);

	const logger = winston.createLogger({
		level: 'info',
		format: winston.format.combine(
			winston.format.errors({ stack: true }),
			winston.format.metadata(),
			winston.format.json()
		),
		transports: [
			new winston.transports.File({
				filename: logFilePath,
			}),
		],
		defaultMeta: {
			initiator,
		},
	});

	return { logger, logFilePath };
}

const ONE_WEEK_MILLIS = 7 * 24 * 60 * 60 * 1000;

async function clearOldLogs(initiator: string) {
	const rootDir = await settings.getSetting<string | undefined>('rootDir');

	if (!rootDir) {
		throw new Error('clearOldLogs: rootDir setting not found');
	}

	const files = await fsp.readdir(rootDir);

	const logFiles = files.filter(
		(f) =>
			f.startsWith(`export-log--${initiator}`) && path.extname(f) === '.json'
	);

	for (const logFile of logFiles) {
		const logFilePath = path.resolve(rootDir, logFile);
		const stat = await fsp.stat(logFilePath);

		// TODO: does this work correctly on Windows?
		if (Date.now() - stat.mtime.getTime() > ONE_WEEK_MILLIS) {
			try {
				await fsp.unlink(logFilePath);
				exportLogger.info({ deletedLogOlderThanOneWeek: logFilePath });
			} catch (e) {
				exportLogger.error('Error trying to delete old log file');
				exportLogger.error(e);
			}
		}
	}
}

function isPlanGameDirectoryEntry(
	obj: PlanGameEntry | PlanGameDirectoryEntry
): obj is PlanGameDirectoryEntry {
	return 'directoryName' in obj;
}

function buildDestFileOperationPath(p: string): DestFileOperationPath {
	const fileName = path.basename(p);
	const split = path.parse(fileName).name.split('_');
	const fileNameDate = convertFileNameDate(split[split.length - 1]);

	if (split.length > 1 && fileNameDate) {
		// drop the date part out of split
		split.pop();
		const fileNameBase = split.join('_');

		return {
			type: 'dated-filename',
			extension: path.extname(fileName),
			fileName,
			fileNameBase,
			relDirPath: path.dirname(p),
			date: fileNameDate,
		};
	} else {
		return {
			type: 'exact',
			relPath: p,
		};
	}
}

function isSrcExactFileOperationPath(
	p: SrcFileOperationPath
): p is SrcExactFileOperationPath {
	return p.type === 'exact';
}

function isSrcDatedFileOperationPath(
	p: SrcFileOperationPath
): p is SrcDatedFilenameFileOperationPath {
	return p.type === 'dated-filename';
}

function isDestExactFileOperationPath(
	p: DestFileOperationPath
): p is DestExactFileOperationPath {
	return p.type === 'exact';
}

function isDestDatedFileOperationPath(
	p: DestFileOperationPath
): p is DestDatedFilenameFileOperationPath {
	return p.type === 'dated-filename';
}

function buildFileOperations(
	srcOpPaths: SrcFileOperationPath[],
	destOpPaths: DestFileOperationPath[]
): FileOperation[] {
	const srcExactPaths = srcOpPaths.filter(isSrcExactFileOperationPath);
	const destExactPaths = destOpPaths.filter(isDestExactFileOperationPath);
	const srcDatedPaths = srcOpPaths.filter(isSrcDatedFileOperationPath);
	const destDatedPaths = destOpPaths.filter(isDestDatedFileOperationPath);

	const srcExactOps = srcExactPaths.flatMap<FileOperation>((srcOpPath) => {
		const existsAtDest = destExactPaths.some((destOpPath) => {
			return (
				srcOpPath.destRelPath.toLowerCase() === destOpPath.relPath.toLowerCase()
			);
		});

		if (
			existsAtDest &&
			// always copy mras. They are small and it is faster to just always
			// copy them than check their hash
			path.extname(srcOpPath.destRelPath).toLowerCase() !== '.mra'
		) {
			return [];
		} else {
			if (!srcOpPath.db_id) {
				throw new Error(
					`srcOpPath missing db_id: ${JSON.stringify(srcOpPath)}`
				);
			}

			return [
				{
					action: 'copy',
					srcPath: path.join(srcOpPath.db_id, srcOpPath.cacheRelPath),
					destPath: srcOpPath.destRelPath,
				},
			];
		}
	});

	// dated files are always cores, and their date is a pretty good signal to see
	// if they have been updated. So no need to "always copy" in this case
	const srcDatedOps = srcDatedPaths.flatMap<FileOperation>((srcOpPath) => {
		const existsOrNewerAtDest = destDatedPaths.some((destOpPath) => {
			return (
				srcOpPath.destRelDirPath.toLowerCase() ===
					destOpPath.relDirPath.toLowerCase() &&
				srcOpPath.fileNameBase.toLowerCase() ===
					destOpPath.fileNameBase.toLowerCase() &&
				srcOpPath.extension.toLowerCase() ===
					destOpPath.extension.toLowerCase() &&
				destOpPath.date.getTime() - srcOpPath.date.getTime() >= 0
			);
		});

		if (existsOrNewerAtDest) {
			return [];
		} else {
			if (!srcOpPath.db_id) {
				throw new Error(
					`srcOpPath missing db_id: ${JSON.stringify(srcOpPath)}`
				);
			}

			return [
				{
					action: 'copy',
					srcPath: path.join(
						srcOpPath.db_id,
						srcOpPath.cacheRelDirPath,
						srcOpPath.fileName
					),
					destPath: path.join(srcOpPath.destRelDirPath, srcOpPath.fileName),
				},
			];
		}
	});

	const destExactOps = destExactPaths.flatMap<FileOperation>((destOpPath) => {
		const existsAtSrc = srcExactPaths.some((srcOpPath) => {
			return (
				destOpPath.relPath.toLowerCase() === srcOpPath.destRelPath.toLowerCase()
			);
		});

		if (existsAtSrc) {
			return [];
		} else {
			return [
				{
					action: 'delete',
					destPath: destOpPath.relPath,
				},
			];
		}
	});

	const destDatedOps = destDatedPaths.flatMap<FileOperation>((destOpPath) => {
		const newerAtSrc = srcDatedPaths.some((srcOpPath) => {
			return (
				destOpPath.relDirPath.toLowerCase() ===
					srcOpPath.destRelDirPath.toLowerCase() &&
				destOpPath.fileNameBase.toLowerCase() ===
					srcOpPath.fileNameBase.toLowerCase() &&
				destOpPath.extension.toLowerCase() ===
					srcOpPath.extension.toLowerCase() &&
				destOpPath.date.getTime() - srcOpPath.date.getTime() < 0
			);
		});

		const inSrc = srcDatedPaths.some((srcOpPath) => {
			return (
				destOpPath.relDirPath.toLowerCase() ===
					srcOpPath.destRelDirPath.toLowerCase() &&
				destOpPath.fileNameBase.toLowerCase() ===
					srcOpPath.fileNameBase.toLowerCase() &&
				destOpPath.extension.toLowerCase() === srcOpPath.extension.toLowerCase()
			);
		});

		if (newerAtSrc || !inSrc) {
			return [
				{
					action: 'delete',
					destPath: path.join(destOpPath.relDirPath, destOpPath.fileName),
				},
			];
		} else {
			return [];
		}
	});

	const uniqued = uniqBy(
		[...srcExactOps, ...srcDatedOps, ...destExactOps, ...destDatedOps],
		JSON.stringify
	);

	return uniqued.sort((a, b) => {
		// put copies before deletes
		const actionSort = a.action.localeCompare(b.action);

		if (actionSort === 0) {
			return a.destPath.localeCompare(b.destPath);
		} else {
			return actionSort;
		}
	});
}

async function performFileSystemFileOperations(
	srcDirRoot: string,
	destDirRoot: string,
	client: FileClient,
	fileOps: FileOperation[],
	cb: (error: null | Error | string, fileOp: FileOperation) => void
) {
	const logger = exportLogger.child({
		method: performFileSystemFileOperations.name,
	});

	for (const fileOp of fileOps) {
		logger.info({ [performFileSystemFileOperations.name]: fileOp });

		const srcPath =
			'srcPath' in fileOp ? path.resolve(srcDirRoot, fileOp.srcPath) : '';

		const destPath = path.join(destDirRoot, fileOp.destPath);

		logger.info({ srcPath, destPath });

		switch (fileOp.action) {
			case 'copy': {
				cb(null, fileOp);
				try {
					await client.mkDir(path.dirname(destPath), true);
					const data = fs.createReadStream(srcPath);
					const result = await client.putFile(data, destPath);
					logger.info({ copyResult: result, fileOp });
				} catch (e) {
					logger.error(e);
					const message = e instanceof Error ? e.message : String(e);
					cb(message, fileOp);
					return;
				}
				break;
			}
			case 'delete': {
				cb(null, fileOp);
				try {
					await client.deleteFile(destPath);
				} catch (e) {
					logger.error(e);
					const message = e instanceof Error ? e.message : String(e);
					cb(message, fileOp);
					return;
				}
				break;
			}
		}
	}
}

const actionToVerb: Record<FileOperation['action'], string> = {
	copy: 'Copying',
	delete: 'Deleting',
};

function getSrcFileOperationPathsFromCatalogEntry(
	entry: CatalogEntry,
	currentDirPath: string
): SrcFileOperationPath[] {
	const paths: SrcFileOperationPath[] = [];

	if (entry.files.mra) {
		paths.push({
			type: 'exact',
			db_id: entry.db_id,
			cacheRelPath: entry.files.mra.relFilePath,
			// only mras go into subdirectories
			destRelPath: path.join(currentDirPath, entry.files.mra.fileName),
		});
	}
	if (entry.files.rbf) {
		// most cores encode their date of creation into their name, like "Foo_20230204",
		// if that is available, great, we can use that date as a guide if this core has
		// been updated or not
		const datedPathComponents = getDatedFilenamePathComponents(
			entry.files.rbf.fileName
		);

		if (datedPathComponents) {
			paths.push({
				type: 'dated-filename',
				db_id: entry.db_id,
				cacheRelDirPath: path.dirname(entry.files.rbf.relFilePath),
				destRelDirPath: path.dirname(entry.files.rbf.relFilePath),
				fileName: entry.files.rbf.fileName,
				...datedPathComponents,
			});
		} else {
			// otherwise we have to treat it as an exact file, which means always copy it.
			// Jotego cores do not encode dates into their names, for example
			paths.push({
				type: 'exact',
				db_id: entry.db_id,
				cacheRelPath: entry.files.rbf.relFilePath,
				destRelPath: entry.files.rbf.relFilePath,
			});
		}
	}
	const romPaths = entry.files.roms.flatMap((re) => {
		if (re.status !== 'ok') {
			return [];
		} else {
			return [
				{
					type: 'exact',
					db_id: entry.db_id,
					cacheRelPath: re.relFilePath,
					destRelPath: re.relFilePath,
				} as const,
			];
		}
	});
	paths.push(...romPaths);

	return paths;
}

function getSrcPathsFromPlan(
	planDir: PlanGameDirectory,
	currentDirPath: string,
	catalog: Catalog,
	updateDbConfigs: UpdateDbConfig[]
): SrcFileOperationPath[] {
	const paths: SrcFileOperationPath[] = [];

	for (const entry of planDir) {
		if (isPlanGameDirectoryEntry(entry)) {
			const subPaths = getSrcPathsFromPlan(
				entry.games,
				// mra directories need to start with _
				path.join(currentDirPath, `_${entry.directoryName}`),
				catalog,
				updateDbConfigs
			);
			paths.push(...subPaths);
		} else if (isPlanGameEntry(entry)) {
			const catalogEntry = getCatalogEntryForMraPath(
				entry.db_id,
				entry.relFilePath,
				catalog,
				updateDbConfigs
			);

			if (!catalogEntry) {
				throw new Error(
					`getSrcPathsFromPlan: failed to find CatalogEntry for: ${entry.relFilePath}`
				);
			}

			const entryPaths = getSrcFileOperationPathsFromCatalogEntry(
				catalogEntry,
				currentDirPath
			);
			paths.push(...entryPaths);
		}
	}

	return paths;
}

async function getSpeedSrcPathsFromCatalog(
	catalog: Catalog
): Promise<SrcFileOperationPath[]> {
	const entries = getAllCatalogEntries(catalog);

	const paths: SrcFileOperationPath[] = [];

	for (const entry of entries) {
		const entryPaths = await getSrcFileOperationPathsFromCatalogEntry(
			entry,
			'' // this is only used for mras, which we don't care about
		);
		const entryPathsWithoutMra = entryPaths.filter((ep) => {
			return (
				ep.type === 'dated-filename' ||
				!ep.cacheRelPath.toLowerCase().endsWith('.mra')
			);
		});
		paths.push(...entryPathsWithoutMra);
	}

	return paths;
}

async function getAllSrcPaths(
	plan: Plan,
	catalog: Catalog
): Promise<SrcFileOperationPath[]> {
	const updateDbConfigs = await settings.getSetting<UpdateDbConfig[]>(
		'updateDbs'
	);

	const srcPathsFromPlan = getSrcPathsFromPlan(
		plan.games,
		'_Arcade',
		catalog,
		updateDbConfigs
	);

	const exportOptimization = await settings.getSetting<
		ExportOptimization | undefined
	>('exportOptimization');

	if (exportOptimization === 'space') {
		return srcPathsFromPlan;
	}

	const speedSrcPathsFromCatalog = await getSpeedSrcPathsFromCatalog(catalog);

	// no need to uniq, they'll be uniq'd later
	return srcPathsFromPlan.concat(speedSrcPathsFromCatalog);
}

async function getExistingDestPaths(
	client: FileClient,
	rootDir: string,
	curDirPath: string
): Promise<DestFileOperationPath[]> {
	const paths: DestFileOperationPath[] = [];
	const rawPaths: string[] = [];

	await client.mkDir(curDirPath, true);
	const entries = await client.listDir(curDirPath);

	for (const entry of entries) {
		const p = path.join(curDirPath, entry);
		const isDirectory = await client.isDir(p);

		if (isDirectory) {
			const subPaths = await getExistingDestPaths(client, rootDir, p);
			paths.push(...subPaths);
		} else {
			rawPaths.push(p.replace(rootDir, ''));
		}
	}

	const finalImmediatePaths = rawPaths.map(buildDestFileOperationPath);

	return paths.concat(finalImmediatePaths);
}

/**
 * recursively descends into directories from bottom up, deleting
 * any empty directories it finds along the way
 */
async function deleteEmptyDestDirectories(
	client: FileClient,
	curDirPath: string
) {
	const logger = exportLogger.child({
		method: deleteEmptyDestDirectories.name,
	});

	const entries = await client.listDir(curDirPath);

	for (const entry of entries) {
		const p = path.join(curDirPath, entry);
		const isDirectory = await client.isDir(p);

		if (isDirectory) {
			await deleteEmptyDestDirectories(client, p);
			const dirEntries = await client.listDir(p);

			logger.info({ directoryPath: p, fileCount: dirEntries.length });

			if (dirEntries.length === 0) {
				await client.rmDir(p);
				logger.info({ deleted: p });
			}
		}
	}
}

async function doExport(
	plan: Plan,
	providedCallback: ExportCallback,
	initiator: string,
	exportType: 'mister' | 'directory',
	clientFactory: (logger: winston.Logger) => FileClient
) {
	const catalog = await getCurrentCatalog();
	const destPathsToIgnore =
		(await settings.getSetting<string[]>('destPathsToIgnore')) ?? [];

	if (!catalog) {
		throw new Error('doExport: no current catalog');
	}

	const start = Date.now();

	const { logger: _exportLogger, logFilePath } = await createExportLogger(
		plan.directoryName,
		initiator
	);
	exportLogger = _exportLogger;

	const client = clientFactory(exportLogger);

	await clearOldLogs(initiator);

	exportLogger.info({ plan });

	let canceled = false;

	const callback: ExportCallback = (args) => {
		exportLogger.info({ callback: args });
		const userProceeding = providedCallback(args);

		if (!userProceeding && !canceled) {
			canceled = true;
			throw new CancelExportError('User canceled the export');
		}
		return userProceeding;
	};

	try {
		callback({
			exportType,
			message: 'Connecting...',
		});

		await client.connect();

		const mountPath = client.getMountPath();
		exportLogger.info({ mountPath });

		const srcPaths = await getAllSrcPaths(plan, catalog);
		exportLogger.info({ [getAllSrcPaths.name]: srcPaths });

		callback({
			exportType,
			message: 'Determining what needs to be copied...',
		});
		const destArcadePaths = await getExistingDestPaths(
			client,
			path.join(mountPath, '/'),
			path.join(mountPath, '_Arcade')
		);
		const destRomPaths = await getExistingDestPaths(
			client,
			path.join(mountPath, '/'),
			path.join(mountPath, 'games', 'mame')
		);
		const destPaths = destArcadePaths.concat(destRomPaths);
		exportLogger.info({
			[getExistingDestPaths.name]: destArcadePaths,
			for: '_Arcade',
		});
		exportLogger.info({
			[getExistingDestPaths.name]: destRomPaths,
			for: 'games/mame',
		});

		const finalDestPaths = destPaths.filter((dp) => {
			if (isDestExactFileOperationPath(dp)) {
				if (
					destPathsToIgnore.some(
						(dpti) => dpti.toLowerCase() === dp.relPath.toLowerCase()
					)
				) {
					exportLogger.info({
						destPathsToIgnore: dp.relPath,
						message:
							'removing this paths from destPaths as it is in destPathsToIgnore',
					});
					return false;
				}
			}

			return true;
		});

		const fileOperations = buildFileOperations(srcPaths, finalDestPaths);

		exportLogger.info({ [buildFileOperations.name]: fileOperations });

		const gameCacheDir = await getGameCacheDir();

		await performFileSystemFileOperations(
			gameCacheDir,
			mountPath,
			client,
			fileOperations,
			(err, fileOp) => {
				if (err) {
					callback({
						exportType,
						message: '',
						error: { type: 'file-error', fileOp },
					});
				} else {
					callback({
						exportType,
						message: `${actionToVerb[fileOp.action]}: ${fileOp.destPath}`,
					});
				}
			}
		);

		callback({
			exportType,
			message: 'Cleaning up empty directories',
		});
		await deleteEmptyDestDirectories(client, path.join(mountPath, '_Arcade'));

		await client.disconnect();
		const duration = Date.now() - start;
		const seconds = duration / 1000;
		const minutes = seconds / 60;

		const durMsg =
			minutes < 1
				? `${seconds.toFixed(2)} seconds`
				: `${minutes.toFixed(2)} minutes`;

		callback({
			exportType,
			message: `Export complete in ${durMsg}`,
			complete: true,
		});
	} catch (e) {
		if (e instanceof CancelExportError) {
			callback({
				exportType,
				message: 'Export canceled',
				complete: true,
				canceled: true,
			});
		} else {
			const message = e instanceof Error ? e.message : String(e);
			exportLogger.error('Uncaught exception');
			exportLogger.error(e);
			callback({
				exportType,
				message: '',
				error: { type: 'unknown', message },
			});
		}
	} finally {
		await Promise.all([client.disconnect(), turnLogIntoArray(logFilePath)]);
		exportLogger.close();
	}
}

async function exportToDirectory(
	plan: Plan,
	destDirPath: string,
	providedCallback: ExportCallback
) {
	const clientFactory = (logger: winston.Logger) => {
		return new LocalFileClient(logger, destDirPath);
	};

	return doExport(
		plan,
		providedCallback,
		'exportToDirectory',
		'directory',
		clientFactory
	);
}

async function exportToMister(
	plan: Plan,
	config: FileClientConnectConfig,
	providedCallback: ExportCallback
) {
	const mountDir = config.mount === 'sdcard' ? 'fat' : config.mount;
	const mountPathSegments = ['/', 'media', mountDir];

	const clientFactory = (logger: winston.Logger) => {
		return new FTPFileClient(logger, mountPathSegments, config);
	};

	return doExport(
		plan,
		providedCallback,
		'exportToMister',
		'mister',
		clientFactory
	);
}

export {
	exportToDirectory,
	exportToMister,
	buildFileOperations,
	buildDestFileOperationPath,
	// exported for unit testing
	doExport,
};
