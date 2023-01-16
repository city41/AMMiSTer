import path from 'node:path';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import mkdirp from 'mkdirp';
import settings from 'electron-settings';
import winston from 'winston';
import { Plan, PlanGameDirectory, PlanGameDirectoryEntry } from '../plan/types';
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
import uniqBy from 'lodash/uniqBy';
import {
	convertFileNameDate,
	getGameCacheDir,
	misterPathJoiner,
} from '../util/fs';
import { CatalogEntry } from '../catalog/types';
import _ from 'lodash';

let exportLogger: winston.Logger;

async function createExportLogger(planName: string, initiator: string) {
	const rootDir = await settings.get('rootDir');

	return winston.createLogger({
		level: 'info',
		format: winston.format.combine(
			winston.format.errors({ stack: true }),
			winston.format.metadata(),
			winston.format.json()
		),
		transports: [
			new winston.transports.File({
				filename: path.resolve(
					(rootDir ?? '').toString(),
					`export-log--${initiator}-${planName.replace(
						/\s/g,
						'_'
					)}-${new Date().toISOString()}.json`
				),
			}),
		],
		defaultMeta: {
			initiator,
		},
	});
}

const ONE_WEEK_MILLIS = 7 * 24 * 60 * 60 * 1000;

async function clearOldLogs(initiator: string) {
	const rootDirSetting = await settings.get('rootDir');

	if (!rootDirSetting) {
		throw new Error('clearOldLogs: rootDir setting not found');
	}
	const rootDir = rootDirSetting.toString();

	const files = await fsp.readdir(rootDir);

	const logFiles = files.filter(
		(f) =>
			f.startsWith(`export-log--${initiator}`) && path.extname(f) === '.json'
	);

	for (const logFile of logFiles) {
		const logFilePath = path.resolve(rootDir, logFile);
		const stat = await fsp.stat(logFilePath);

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
	obj: CatalogEntry | PlanGameDirectoryEntry
): obj is PlanGameDirectoryEntry {
	return 'directoryName' in obj;
}

function getDatedFilenamePathComponents(fileName: string): {
	fileNameBase: string;
	extension: string;
	date: Date;
} {
	const split = path.parse(fileName).name.split('_');
	const date = convertFileNameDate(split[split.length - 1]);

	if (!date) {
		throw new Error(`a dated filename formed an invalid Date: ${fileName}`);
	}

	return {
		fileNameBase: split[0],
		extension: path.extname(fileName),
		date,
	};
}

function buildDestFileOperationPath(p: string): DestFileOperationPath {
	const fileName = path.basename(p);
	const split = path.parse(fileName).name.split('_');
	const fileNameDate = convertFileNameDate(split[1]);

	if (split.length === 2 && fileNameDate) {
		return {
			type: 'dated-filename',
			extension: path.extname(fileName),
			fileName,
			fileNameBase: split[0],
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
	destOpPaths: DestFileOperationPath[],
	destPathJoiner: (...segments: string[]) => string
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
					destPath: destPathJoiner(
						srcOpPath.destRelDirPath,
						srcOpPath.fileName
					),
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
					destPath: destPathJoiner(destOpPath.relDirPath, destOpPath.fileName),
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

async function performLocalFileSystemFileOperations(
	srcDirRoot: string,
	destDirRoot: string,
	fileOps: FileOperation[],
	cb: (err: null | string, fileOp: FileOperation) => void
) {
	const logger = exportLogger.child({
		method: performLocalFileSystemFileOperations.name,
	});

	for (const fileOp of fileOps) {
		logger.info({ performFileOperations: fileOp });

		const srcPath =
			'srcPath' in fileOp ? path.resolve(srcDirRoot, fileOp.srcPath) : '';
		const destPath = path.resolve(destDirRoot, fileOp.destPath);

		switch (fileOp.action) {
			case 'copy': {
				cb(null, fileOp);
				try {
					await mkdirp(path.dirname(destPath));
					await fsp.copyFile(srcPath, destPath);
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
					await fsp.unlink(destPath);
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

async function performRemoteFileSystemFileOperations(
	srcDirRoot: string,
	destDirRoot: string,
	client: FileClient,
	fileOps: FileOperation[],
	cb: (error: null | Error | string, fileOp: FileOperation) => void
) {
	const logger = exportLogger.child({
		method: performRemoteFileSystemFileOperations.name,
	});

	for (const fileOp of fileOps) {
		logger.info({ performFileOperations: fileOp });

		const srcPath =
			'srcPath' in fileOp ? path.resolve(srcDirRoot, fileOp.srcPath) : '';

		// dest paths are for the mister, path.join is wrong
		const destPath = misterPathJoiner(destDirRoot, fileOp.destPath);

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

function getSrcPathsFromPlan(
	planDir: PlanGameDirectory,
	currentDirPath: string,
	destPathJoiner: (...segments: string[]) => string
): SrcFileOperationPath[] {
	const paths: SrcFileOperationPath[] = [];

	for (const entry of planDir) {
		if (isPlanGameDirectoryEntry(entry)) {
			const subPaths = getSrcPathsFromPlan(
				entry.games,
				// mra directories need to start with _
				path.join(currentDirPath, `_${entry.directoryName}`),
				destPathJoiner
			);
			paths.push(...subPaths);
		} else {
			if (entry.files.mra) {
				paths.push({
					type: 'exact',
					db_id: entry.db_id,
					cacheRelPath: entry.files.mra.relFilePath,
					// only mras go into subdirectories
					destRelPath: destPathJoiner(currentDirPath, entry.files.mra.fileName),
				});
			}
			if (entry.files.rbf) {
				paths.push({
					type: 'dated-filename',
					db_id: entry.db_id,
					cacheRelDirPath: path.dirname(entry.files.rbf.relFilePath),
					destRelDirPath: path.dirname(entry.files.rbf.relFilePath),
					fileName: entry.files.rbf.fileName,
					...getDatedFilenamePathComponents(entry.files.rbf.fileName),
				});
			}
			const romPaths = entry.files.roms.flatMap((re) => {
				if (!re.md5) {
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
		}
	}

	return paths;
}

async function getExistingLocalDestPaths(
	destDirRootPath: string,
	curDirPath: string
): Promise<DestFileOperationPath[]> {
	const paths: DestFileOperationPath[] = [];
	const rawPaths: string[] = [];

	const entries = await fsp.readdir(path.resolve(destDirRootPath, curDirPath));

	for (const entry of entries) {
		if (
			fs
				.statSync(path.resolve(destDirRootPath, curDirPath, entry))
				.isDirectory()
		) {
			const subPaths = await getExistingLocalDestPaths(
				destDirRootPath,
				path.join(curDirPath, entry)
			);
			paths.push(...subPaths);
		} else {
			rawPaths.push(path.join(curDirPath, entry));
		}
	}

	const finalImmediatePaths = rawPaths.map(buildDestFileOperationPath);

	return paths.concat(finalImmediatePaths);
}

async function getExistingRemoteDestPaths(
	client: FileClient,
	rootDir: string,
	curDirPath: string
): Promise<DestFileOperationPath[]> {
	const paths: DestFileOperationPath[] = [];
	const rawPaths: string[] = [];

	const entries = await client.listDir(curDirPath);

	for (const entry of entries) {
		// since this is running on the mister, path.join is incorrect
		const p = misterPathJoiner(curDirPath, entry);
		const isDirectory = await client.isDir(p);

		if (isDirectory) {
			const subPaths = await getExistingRemoteDestPaths(client, rootDir, p);
			paths.push(...subPaths);
		} else {
			rawPaths.push(p.replace(rootDir, ''));
		}
	}

	const finalImmediatePaths = rawPaths.map(buildDestFileOperationPath);

	return paths.concat(finalImmediatePaths);
}

/**
 * recursively descends into local directories from bottom up, deleting
 * any empty directories it finds along the way
 */
async function deleteEmptyLocalDirectories(curDirPath: string) {
	const logger = exportLogger.child({
		method: deleteEmptyLocalDirectories.name,
	});
	const entries = await fsp.readdir(curDirPath);

	for (const entry of entries) {
		const p = path.join(curDirPath, entry);
		const s = fs.statSync(p);

		if (s.isDirectory()) {
			await deleteEmptyLocalDirectories(p);
			const dirEntries = await fsp.readdir(p);

			logger.info({ directoryPath: p, fileCount: dirEntries.length });

			if (dirEntries.length === 0) {
				await fsp.rmdir(p);
				logger.info({ deleted: p });
			}
		}
	}
}

async function exportToDirectory(
	plan: Plan,
	destDirPath: string,
	providedCallback: ExportCallback
) {
	exportLogger = await createExportLogger(
		plan.directoryName,
		exportToDirectory.name
	);

	await clearOldLogs(exportToDirectory.name);

	exportLogger.info({ destDirPath, plan });

	const callback: ExportCallback = (args) => {
		exportLogger.info({ callback: args });
		providedCallback(args);
	};

	try {
		const srcPaths = getSrcPathsFromPlan(plan.games, '_Arcade', path.join);
		const destPaths = await getExistingLocalDestPaths(destDirPath, '');
		const fileOperations = buildFileOperations(srcPaths, destPaths, path.join);

		exportLogger.info({ [getSrcPathsFromPlan.name]: srcPaths });
		exportLogger.info({ [getExistingLocalDestPaths.name]: destPaths });
		exportLogger.info({ [buildFileOperations.name]: fileOperations });

		const gameCacheDir = await getGameCacheDir();

		await performLocalFileSystemFileOperations(
			gameCacheDir,
			destDirPath,
			fileOperations,
			(err, fileOp) => {
				if (err) {
					callback({
						exportType: 'directory',
						message: '',
						error: { type: 'file-error', fileOp },
					});
				} else {
					callback({
						exportType: 'directory',
						message: `${actionToVerb[fileOp.action]}: ${fileOp.destPath}`,
					});
				}
			}
		);

		callback({
			exportType: 'directory',
			message: 'Cleaning up empty directories',
		});
		await deleteEmptyLocalDirectories(path.join(destDirPath, '_Arcade'));

		callback({
			exportType: 'directory',
			message: `Export of "${plan.directoryName}" to ${destDirPath} complete`,
			complete: true,
		});
	} catch (e) {
		exportLogger.error('Uncaught exception');
		exportLogger.error(e);
		const message = e instanceof Error ? e.message : String(e);
		callback({
			exportType: 'directory',
			message,
			error: { type: 'unknown' },
		});
	} finally {
		exportLogger.close();
	}
}

/**
 * recursively descends into directories from bottom up, deleting
 * any empty directories it finds along the way
 */
async function deleteEmptyRemoteDirectories(
	client: FileClient,
	curDirPath: string
) {
	const logger = exportLogger.child({
		method: deleteEmptyRemoteDirectories.name,
	});

	const entries = await client.listDir(curDirPath);

	for (const entry of entries) {
		const p = misterPathJoiner(curDirPath, entry);
		const isDirectory = await client.isDir(p);

		if (isDirectory) {
			await deleteEmptyRemoteDirectories(client, p);
			const dirEntries = await client.listDir(p);

			logger.info({ directoryPath: p, fileCount: dirEntries.length });

			if (dirEntries.length === 0) {
				await client.rmDir(p);
				logger.info({ deleted: p });
			}
		}
	}
}

async function exportToMister(
	plan: Plan,
	config: FileClientConnectConfig,
	providedCallback: ExportCallback
) {
	exportLogger = await createExportLogger(
		plan.directoryName,
		exportToMister.name
	);

	await clearOldLogs(exportToMister.name);

	exportLogger.info({ config, plan });

	const callback: ExportCallback = (args) => {
		exportLogger.info({ callback: args });
		providedCallback(args);
	};

	try {
		const start = Date.now();

		callback({
			exportType: 'mister',
			message: `Connecting to MiSTer at ${config.host}...`,
		});

		const client = new FTPFileClient(exportLogger.child({ ftpClient: true }));
		try {
			await client.connect({
				host: config.host,
				port: config.port,
				mount: config.mount,
				username: config.username,
				password: config.password,
			});
		} catch (e) {
			exportLogger.error({ context: 'failed to connect', config });
			exportLogger.error(e);
			callback({
				exportType: 'mister',
				message: '',
				error: { type: 'connect-fail' },
			});
			return;
		}

		const mountDir = config.mount === 'sdcard' ? 'fat' : config.mount;
		// this path is on the mister itself, using path.join would be wrong
		const mountPath = misterPathJoiner('/media/', mountDir);
		exportLogger.info({ mountPath });

		const srcPaths = getSrcPathsFromPlan(
			plan.games,
			'_Arcade',
			misterPathJoiner
		);

		exportLogger.info({ [getSrcPathsFromPlan.name]: srcPaths });

		callback({
			exportType: 'mister',
			message: 'Determining what is currently on the MiSTer',
		});
		const destArcadePaths = await getExistingRemoteDestPaths(
			client,
			mountPath + '/',
			misterPathJoiner(mountPath, '_Arcade')
		);
		const destRomPaths = await getExistingRemoteDestPaths(
			client,
			mountPath + '/',
			misterPathJoiner(mountPath, 'games', 'mame')
		);
		const destPaths = destArcadePaths.concat(destRomPaths);
		exportLogger.info({
			[getExistingRemoteDestPaths.name]: destArcadePaths,
			for: '_Arcade',
		});
		exportLogger.info({
			[getExistingRemoteDestPaths.name]: destRomPaths,
			for: 'games/mame',
		});
		const fileOperations = buildFileOperations(
			srcPaths,
			destPaths,
			misterPathJoiner
		);

		exportLogger.info({ [buildFileOperations.name]: fileOperations });

		const gameCacheDir = await getGameCacheDir();

		await performRemoteFileSystemFileOperations(
			gameCacheDir,
			mountPath,
			client,
			fileOperations,
			(err, fileOp) => {
				if (err) {
					callback({
						exportType: 'mister',
						message: '',
						error: { type: 'file-error', fileOp },
					});
				} else {
					callback({
						exportType: 'mister',
						message: `${actionToVerb[fileOp.action]}: ${fileOp.destPath}`,
					});
				}
			}
		);

		callback({
			exportType: 'mister',
			message: 'Cleaning up empty directories',
		});
		await deleteEmptyRemoteDirectories(
			client,
			misterPathJoiner(mountPath, '_Arcade')
		);

		await client.disconnect();
		const duration = Date.now() - start;
		const seconds = duration / 1000;
		const minutes = seconds / 60;

		const durMsg =
			minutes < 1
				? `${Math.round(seconds)} seconds`
				: `${minutes.toFixed(2)} minutes`;

		callback({
			exportType: 'mister',
			message: `Export complete in ${durMsg}`,
			complete: true,
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		exportLogger.error('Uncaught exception');
		exportLogger.error(e);
		callback({
			exportType: 'mister',
			message: '',
			error: { type: 'unknown', message },
		});
	} finally {
		exportLogger.close();
	}
}

export {
	exportToDirectory,
	exportToMister,
	buildFileOperations,
	buildDestFileOperationPath as buildFileOperationPath,
};
