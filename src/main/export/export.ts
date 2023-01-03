import path from 'node:path';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import mkdirp from 'mkdirp';
import Debug from 'debug';
import SMB2 from '@marsaud/smb2';
import { Plan, PlanGameDirectory, PlanGameDirectoryEntry } from '../plan/types';
import {
	SrcFileOperationPath,
	DestFileOperationPath,
	FileOperation,
	SambaConfig,
	UpdateCallback,
	SrcExactFileOperationPath,
	SrcDatedFilenameFileOperationPath,
	DestExactFileOperationPath,
	DestDatedFilenameFileOperationPath,
} from './types';
import uniqBy from 'lodash/uniqBy';
import { getGameCacheDir } from '../util/fs';
import { CatalogEntry } from '../catalog/types';

const debug = Debug('main/export/export.ts');

function isPlanGameDirectoryEntry(
	obj: CatalogEntry | PlanGameDirectoryEntry
): obj is PlanGameDirectoryEntry {
	return 'directoryName' in obj;
}

function convertFileNameDate(str: string | null | undefined): Date | null {
	if (!str || str.trim().length !== 8 || !str.startsWith('20')) {
		return null;
	}

	const chars = str.split('');
	const withDashes = [
		...chars.slice(0, 4),
		'-',
		...chars.slice(4, 6),
		'-',
		...chars.slice(6),
	].join('');

	const d = new Date(withDashes);
	if (d.toString().toLowerCase() === 'invalid date') {
		debugger;
	}
	return d;
}

function getDatedFilenamePathComponents(fileName: string): {
	fileNameBase: string;
	extension: string;
	date: Date;
} {
	const split = path.parse(fileName).name.split('_');
	const date = convertFileNameDate(split[1]);

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
	destOpPaths: DestFileOperationPath[]
): FileOperation[] {
	const srcExactPaths = srcOpPaths.filter(isSrcExactFileOperationPath);
	const destExactPaths = destOpPaths.filter(isDestExactFileOperationPath);
	const srcDatedPaths = srcOpPaths.filter(isSrcDatedFileOperationPath);
	const destDatedPaths = destOpPaths.filter(isDestDatedFileOperationPath);

	const srcExactOps = srcExactPaths.flatMap<FileOperation>((srcOpPath) => {
		const existsAtDest = destExactPaths.some((destOpPath) => {
			return srcOpPath.destRelPath === destOpPath.relPath;
		});

		if (existsAtDest) {
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

	const srcDatedOps = srcDatedPaths.flatMap<FileOperation>((srcOpPath) => {
		const existsOrNewerAtDest = destDatedPaths.some((destOpPath) => {
			return (
				srcOpPath.destRelDirPath === destOpPath.relDirPath &&
				srcOpPath.fileNameBase === destOpPath.fileNameBase &&
				srcOpPath.extension === destOpPath.extension &&
				destOpPath.date.getTime() - srcOpPath.date.getTime() >= 0
			);
		});

		if (existsOrNewerAtDest) {
			return [];
		} else {
			if (!srcOpPath.db_id) {
				debugger;
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
			return destOpPath.relPath === srcOpPath.destRelPath;
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
				destOpPath.relDirPath === srcOpPath.destRelDirPath &&
				destOpPath.fileNameBase === srcOpPath.fileNameBase &&
				destOpPath.extension === srcOpPath.extension &&
				destOpPath.date.getTime() - srcOpPath.date.getTime() < 0
			);
		});

		const inSrc = srcDatedPaths.some((srcOpPath) => {
			return (
				destOpPath.relDirPath === srcOpPath.destRelDirPath &&
				destOpPath.fileNameBase === srcOpPath.fileNameBase &&
				destOpPath.extension === srcOpPath.extension
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

	return uniqBy(
		[...srcExactOps, ...srcDatedOps, ...destExactOps, ...destDatedOps],
		JSON.stringify
	);
}

async function performLocalFileSystemFileOperations(
	srcDirRoot: string,
	destDirRoot: string,
	fileOps: FileOperation[],
	cb: (fileOp: FileOperation) => void
) {
	for (const fileOp of fileOps) {
		debug(`performFileOperations: ${JSON.stringify(fileOp)}`);

		const srcPath =
			'srcPath' in fileOp ? path.resolve(srcDirRoot, fileOp.srcPath) : '';
		const destPath = path.resolve(destDirRoot, fileOp.destPath);

		switch (fileOp.action) {
			case 'copy': {
				await mkdirp(path.dirname(destPath));
				await fsp.copyFile(srcPath, destPath);
				cb(fileOp);
				break;
			}
			case 'delete': {
				await fsp.unlink(destPath);
				cb(fileOp);
				break;
			}
			case 'move': {
				await mkdirp(path.dirname(destPath));
				await fsp.rename(srcPath, destPath);
				cb(fileOp);
				break;
			}
		}
	}
}

const actionToVerb: Record<FileOperation['action'], string> = {
	copy: 'Copied',
	delete: 'Deleted',
	move: 'Moved',
};

function getSrcPathsFromPlan(
	planDir: PlanGameDirectory,
	currentDirPath: string
): SrcFileOperationPath[] {
	const paths: SrcFileOperationPath[] = [];

	for (const entry of planDir) {
		if (isPlanGameDirectoryEntry(entry)) {
			const subPaths = getSrcPathsFromPlan(
				entry.games,
				// mra directories need to start with _
				path.join(currentDirPath, `_${entry.directoryName}`)
			);
			paths.push(...subPaths);
		} else {
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

async function getExistingDestPaths(
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
			const subPaths = await getExistingDestPaths(
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

async function exportToDirectory(
	plan: Plan,
	destDirPath: string,
	callback: UpdateCallback
) {
	debug(`exportToDirectory(plan, ${destDirPath}, callback)`);
	const gameCacheDir = await getGameCacheDir();

	const srcPaths = getSrcPathsFromPlan(plan.games, '_Arcade');
	const destPaths = await getExistingDestPaths(destDirPath, '');
	const fileOperations = buildFileOperations(srcPaths, destPaths);

	debug(
		`exportToDirectory: fileOperations:\n${fileOperations
			.map((fo) => JSON.stringify(fo))
			.join('\n')}`
	);

	await performLocalFileSystemFileOperations(
		gameCacheDir,
		destDirPath,
		fileOperations,
		(fileOp) => {
			callback({
				message: `${actionToVerb[fileOp.action]}: ${fileOp.destPath}`,
			});
		}
	);

	callback({
		message: `Export of "${plan.directoryName}" to ${destDirPath} complete`,
		complete: true,
	});
}

async function exportToMister(
	_plan: Plan,
	config: SambaConfig,
	callback: UpdateCallback
) {
	const client = new SMB2({
		share: `\\\\${config.host}\\${config.share}`,
		domain: config.domain,
		username: config.username,
		password: config.password,
	});

	callback({ message: 'smbTest...' });
	const result = await client.readdir('_Arcade');

	callback({ message: JSON.stringify(result, null, 2) });

	await new Promise((resolve) => setTimeout(resolve, 10000));

	callback({ message: 'Export complete', complete: true });
}

export {
	exportToDirectory,
	exportToMister,
	buildFileOperations,
	buildDestFileOperationPath as buildFileOperationPath,
};
