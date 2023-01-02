import path from 'node:path';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import mkdirp from 'mkdirp';
import Debug from 'debug';
import SMB2 from '@marsaud/smb2';
import { Plan } from '../plan/types';
import { FileOperation, SambaConfig, UpdateCallback } from './types';
import { PlanGameDirectory, PlanGameDirectoryEntry } from '../plan/types';
import { CatalogEntry } from '../catalog/types';
import { getGameCacheDir } from '../util/fs';
import uniqBy from 'lodash/uniqBy';

const debug = Debug('main/export/export.ts');

function isPlanGameDirectoryEntry(
	obj: CatalogEntry | PlanGameDirectoryEntry
): obj is PlanGameDirectoryEntry {
	return 'directoryName' in obj;
}

function buildFileOperationsForDirectory(
	srcRootDir: string,
	destRootDir: string,
	mraParentDir: string,
	dir: PlanGameDirectory
): FileOperation[] {
	const operations: FileOperation[] = [];

	for (const entry of dir) {
		if (isPlanGameDirectoryEntry(entry)) {
			const subOperations = buildFileOperationsForDirectory(
				srcRootDir,
				destRootDir,
				path.join(mraParentDir, entry.directoryName),
				entry.games
			);
			operations.push(...subOperations);
		} else {
			// TODO: deal with the !'s
			// MRA
			operations.push({
				action: 'copy',
				srcPath: path.resolve(
					srcRootDir,
					entry.files.mra!.db_id,
					'_Arcade',
					entry.files.mra!.fileName
				),
				destPath: path.resolve(
					destRootDir,
					'_Arcade',
					mraParentDir,
					entry.files.mra!.fileName
				),
			});

			// RBF
			operations.push({
				action: 'copy',
				srcPath: path.resolve(
					srcRootDir,
					entry.files.rbf!.db_id,
					'_Arcade',
					'cores',
					entry.files.rbf!.fileName
				),
				destPath: path.resolve(
					destRootDir,
					'_Arcade',
					'cores',
					entry.files.rbf!.fileName
				),
			});

			// ROM
			const romOperations = entry.files.roms.map((r) => {
				return {
					action: 'copy-if-exists',
					srcPath: path.resolve(
						srcRootDir,
						r.db_id,
						'games',
						'mame',
						r.fileName
					),
					destPath: path.resolve(destRootDir, 'games', 'mame', r.fileName),
				} as const;
			});
			operations.push(...romOperations);
		}
	}

	return uniqBy(operations, JSON.stringify);
}

async function buildFileOperations(
	plan: Plan,
	destDirPath: string
): Promise<FileOperation[]> {
	const gameCacheDir = await getGameCacheDir();

	return buildFileOperationsForDirectory(
		gameCacheDir,
		destDirPath,
		'',
		plan.games
	);
}

async function performFileOperations(
	fileOps: FileOperation[],
	cb: (fileOp: FileOperation) => void
) {
	for (const fileOp of fileOps) {
		debug(`performFileOperations: ${JSON.stringify(fileOp)}`);

		switch (fileOp.action) {
			case 'copy': {
				await mkdirp(path.dirname(fileOp.destPath));
				await fsp.copyFile(fileOp.srcPath, fileOp.destPath);
				cb(fileOp);
				break;
			}
			case 'copy-if-exists': {
				const exists = !!fs.statSync(fileOp.srcPath, { throwIfNoEntry: false });
				if (exists) {
					await mkdirp(path.dirname(fileOp.destPath));
					await fsp.copyFile(fileOp.srcPath, fileOp.destPath);
					cb(fileOp);
				} else {
					debug(
						`performFileOperations: copy-if-exists but doesnt exist: ${fileOp.srcPath}`
					);
				}
				break;
			}
			case 'delete': {
				await fsp.unlink(fileOp.destPath);
				cb(fileOp);
				break;
			}
			case 'move': {
				await mkdirp(path.dirname(fileOp.destPath));
				await fsp.rename(fileOp.srcPath, fileOp.destPath);
				cb(fileOp);
				break;
			}
		}
	}
}

const actionToVerb: Record<FileOperation['action'], string> = {
	copy: 'Copied',
	'copy-if-exists': 'Copied',
	delete: 'Deleted',
	move: 'Moved',
};

async function exportToDirectory(
	plan: Plan,
	destDirPath: string,
	callback: UpdateCallback
) {
	debug(`exportToDirectory(plan, ${destDirPath}, callback)`);

	const fileOperations = await buildFileOperations(plan, destDirPath);

	await fsp.rm(destDirPath, { recursive: true, force: true });

	await performFileOperations(fileOperations, (fileOp) => {
		callback({ message: `${actionToVerb[fileOp.action]}: ${fileOp.destPath}` });
	});

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

export { exportToDirectory, exportToMister };
