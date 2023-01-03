import path from 'node:path';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import mkdirp from 'mkdirp';
import Debug from 'debug';
import SMB2 from '@marsaud/smb2';
import { Plan, PlanGameDirectory, PlanGameDirectoryEntry } from '../plan/types';
import {
	FileOperationPath,
	FileOperation,
	SambaConfig,
	UpdateCallback,
	ExactFileOperationPath,
	DatedFilenameFileOperationPath,
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

function buildFileOperationPath(p: string): FileOperationPath {
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

function isExactFileOperationPath(
	p: FileOperationPath
): p is ExactFileOperationPath {
	return p.type === 'exact';
}

function isDatedFileOperationPath(
	p: FileOperationPath
): p is DatedFilenameFileOperationPath {
	return p.type === 'dated-filename';
}

function buildFileOperations(
	srcOpPaths: FileOperationPath[],
	destOpPaths: FileOperationPath[]
): FileOperation[] {
	const srcExactPaths = srcOpPaths.filter(isExactFileOperationPath);
	const destExactPaths = destOpPaths.filter(isExactFileOperationPath);
	const srcDatedPaths = srcOpPaths.filter(isDatedFileOperationPath);
	const destDatedPaths = destOpPaths.filter(isDatedFileOperationPath);

	const srcExactOps = srcExactPaths.flatMap<FileOperation>((srcOpPath) => {
		const existsAtDest = destExactPaths.some((destOpPath) => {
			return srcOpPath.relPath === destOpPath.relPath;
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
					srcPath: path.join(srcOpPath.db_id, srcOpPath.relPath),
					destPath: srcOpPath.relPath,
				},
			];
		}
	});

	const srcDatedOps = srcDatedPaths.flatMap<FileOperation>((srcOpPath) => {
		const existsOrNewerAtDest = destDatedPaths.some((destOpPath) => {
			return (
				srcOpPath.relDirPath === destOpPath.relDirPath &&
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
						srcOpPath.relDirPath,
						srcOpPath.fileName
					),
					destPath: path.join(srcOpPath.relDirPath, srcOpPath.fileName),
				},
			];
		}
	});

	const destExactOps = destExactPaths.flatMap<FileOperation>((destOpPath) => {
		const existsAtSrc = srcExactPaths.some((srcOpPath) => {
			return destOpPath.relPath === srcOpPath.relPath;
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
				destOpPath.relDirPath === srcOpPath.relDirPath &&
				destOpPath.fileNameBase === srcOpPath.fileNameBase &&
				destOpPath.extension === srcOpPath.extension &&
				destOpPath.date.getTime() - srcOpPath.date.getTime() < 0
			);
		});

		const inSrc = srcDatedPaths.some((srcOpPath) => {
			return (
				destOpPath.relDirPath === srcOpPath.relDirPath &&
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

function getSrcPathsFromPlan(planDir: PlanGameDirectory): FileOperationPath[] {
	const paths: FileOperationPath[] = [];
	const rawPaths: Array<{ db_id: string; path: string }> = [];

	for (const entry of planDir) {
		if (isPlanGameDirectoryEntry(entry)) {
			const subPaths = getSrcPathsFromPlan(entry.games);
			paths.push(...subPaths);
		} else {
			if (entry.files.mra) {
				rawPaths.push({
					db_id: entry.db_id,
					path: entry.files.mra.relFilePath,
				});
			}
			if (entry.files.rbf) {
				rawPaths.push({
					db_id: entry.db_id,
					path: entry.files.rbf.relFilePath,
				});
			}
			const romPaths = entry.files.roms.flatMap((re) => {
				if (!re.md5) {
					return [];
				} else {
					return [
						{
							db_id: entry.db_id,
							path: re.relFilePath,
						},
					];
				}
			});
			rawPaths.push(...romPaths);
		}
	}

	const finalImmediatePaths = rawPaths.map((rp) => {
		const opPath = buildFileOperationPath(rp.path);
		return {
			...opPath,
			db_id: rp.db_id,
		};
	});

	return paths.concat(finalImmediatePaths);
}

async function getExistingDestPaths(
	destDirRootPath: string,
	curDirPath: string
): Promise<FileOperationPath[]> {
	const paths: FileOperationPath[] = [];
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

	const finalImmediatePaths = rawPaths.map(buildFileOperationPath);

	return paths.concat(finalImmediatePaths);
}

async function exportToDirectory(
	plan: Plan,
	destDirPath: string,
	callback: UpdateCallback
) {
	debug(`exportToDirectory(plan, ${destDirPath}, callback)`);
	const gameCacheDir = await getGameCacheDir();

	const srcPaths = getSrcPathsFromPlan(plan.games);
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
	buildFileOperationPath,
};
