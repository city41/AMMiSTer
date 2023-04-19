import os from 'node:os';
import path from '../../util/universalPath';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { defaultUpdateDbs } from '../../settings/defaultUpdateDbs';
import { updateCatalog } from '../../catalog';
import type { Plan, PlanGameDirectory } from '../../plan/types';
import type {
	Catalog,
	CatalogEntry,
	HashedCatalogFileEntry,
} from '../../catalog/types';
import type { Settings } from '../../settings/types';
import { exportToDirectory } from '../export';
import { exists } from '../../util/fs';
import { getSetting } from '../../settings';

const TMP_DIR = path.resolve(os.tmpdir(), 'ammister-integration-tests-export');

jest.retryTimes(2);

jest.mock('../../settings', () => {
	return {
		getSetting: jest.fn(),
	};
});

async function assertExportedMras(
	currentDir: string,
	planGameDir: PlanGameDirectory,
	catalogEntries: CatalogEntry[]
) {
	for (const entry of planGameDir) {
		if ('games' in entry) {
			await assertExportedMras(
				path.resolve(currentDir, `_${entry.directoryName}`),
				entry.games,
				catalogEntries
			);
		} else {
			const catalogEntry = catalogEntries.find(
				(ce) => ce.files.mra.relFilePath === entry.relFilePath
			);
			expect(catalogEntry).toBeDefined();
			expect(catalogEntry?.db_id).toBe(entry.db_id);

			const fileEntry = catalogEntry!.files.mra;
			const filePath = path.resolve(currentDir, fileEntry!.fileName);

			const fileExists = await exists(filePath);

			if (!fileExists) {
				throw new Error(`Expected to exist: ${filePath}`);
			}
		}
	}
}

async function assertNoEmptyMraDirectories(currentDir: string) {
	const curFiles = await fsp.readdir(currentDir);

	let assertionCount = 0;

	for (const curFile of curFiles) {
		const fullPath = path.resolve(currentDir, curFile);
		const isDir = fs.statSync(fullPath).isDirectory();
		if (curFile.startsWith('_') && isDir) {
			await assertNoEmptyMraDirectories(fullPath);
			assertionCount += 1;
		} else if (!isDir) {
			if (!curFile.toLowerCase().endsWith('.mra')) {
				throw new Error(`Unexpected file found in plan dir: ${fullPath}`);
			}

			assertionCount += 1;
		}
	}

	// if no assertions happened, then this is an empty dir
	expect(assertionCount).toBeGreaterThan(0);
}

async function assertExportedRbfsFromPlan(
	coreDir: string,
	planGameDir: PlanGameDirectory,
	catalogEntries: CatalogEntry[]
) {
	for (const entry of planGameDir) {
		if ('games' in entry) {
			await assertExportedRbfsFromPlan(coreDir, entry.games, catalogEntries);
		} else {
			const catalogEntry = catalogEntries.find(
				(ce) => ce.files.mra.relFilePath === entry.relFilePath
			);
			expect(catalogEntry).toBeDefined();
			expect(catalogEntry?.db_id).toBe(entry.db_id);

			const fileEntry = catalogEntry!.files.rbf;
			const filePath = path.resolve(coreDir, fileEntry!.fileName);

			const fileExists = await exists(filePath);

			if (!fileExists) {
				throw new Error(`Expected to exist: ${filePath}`);
			}
		}
	}
}

function rbfInPlan(
	rbf: HashedCatalogFileEntry,
	planGameDir: PlanGameDirectory,
	catalogEntries: CatalogEntry[]
) {
	for (const entry of planGameDir) {
		if ('games' in entry) {
			if (rbfInPlan(rbf, entry.games, catalogEntries)) {
				return true;
			}
		} else {
			const catalogEntry = catalogEntries.find(
				(ce) =>
					ce.db_id === entry.db_id &&
					ce.files.mra.relFilePath === entry.relFilePath
			);

			if (catalogEntry?.files.rbf?.fileName === rbf.fileName) {
				return true;
			}
		}
	}

	return false;
}

async function assertNoExtraRbfsBeyondPlan(
	coreDir: string,
	plan: Plan,
	catalogEntries: CatalogEntry[]
) {
	const rbfs = catalogEntries.map((ce) => ce.files.rbf);

	for (const rbf of rbfs) {
		const rbfPath = path.resolve(coreDir, rbf!.fileName);
		const rbfExists = await exists(rbfPath);

		if (rbfExists) {
			if (!rbfInPlan(rbf!, plan.games, catalogEntries)) {
				throw new Error(
					`rbf, ${rbf!.fileName}, was found exported but wasnt in the plan`
				);
			}
		}
	}
}

async function assertAllRbfsFromCatalogGotExported(
	coreDir: string,
	catalogEntries: CatalogEntry[]
) {
	const rbfs = catalogEntries.map((ce) => ce.files.rbf);

	for (const rbf of rbfs) {
		const rbfPath = path.resolve(coreDir, rbf!.fileName);
		const rbfExists = await exists(rbfPath);

		if (!rbfExists) {
			throw new Error(`RBF from catalog not found in export: ${rbfPath}`);
		}
	}
}

async function assertExportLog(dir: string) {
	const curFiles = await fsp.readdir(dir);
	const logFile = curFiles.find((f) =>
		f.startsWith('export-log--exportToDirectory')
	);

	if (!logFile) {
		throw new Error(`Failed to find an export log in: ${dir}`);
	}

	const fullLogPath = path.resolve(dir, logFile);
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const exportLogEntries = require(fullLogPath);

	if (!Array.isArray(exportLogEntries)) {
		throw new Error(`log file at ${fullLogPath} is not a JSON array`);
	}

	expect(exportLogEntries.length).toBeGreaterThan(1);
}

describe('export integration', function () {
	beforeAll(function () {
		return fsp.rm(TMP_DIR, { force: true, recursive: true, retryDelay: 1000 });
	});

	afterEach(function () {
		return fsp.rm(TMP_DIR, { force: true, recursive: true, retryDelay: 1000 });
	});

	describe('space exports', function () {
		beforeAll(function () {
			// @ts-expect-error doesnt know it is a mock
			getSetting.mockImplementation((settingKey: keyof Settings) => {
				switch (settingKey) {
					case 'rootDir':
						return Promise.resolve(TMP_DIR);
					case 'downloadRoms':
						return Promise.resolve(false);
					case 'updateDbs': {
						const updateDbs = defaultUpdateDbs.map((udb) => {
							return {
								...udb,
								enabled: udb.db_id === 'theypsilon_unofficial_distribution',
							};
						});

						return Promise.resolve(updateDbs);
					}
					case 'exportOptimization':
						return Promise.resolve('space');
					default:
						return Promise.resolve('mock-setting');
				}
			});
		});

		it('should do a space export', async function () {
			const updateCatalogCallback = jest.fn().mockReturnValue(true);
			await updateCatalog(updateCatalogCallback);

			const catalog = updateCatalogCallback.mock.lastCall?.[0]
				.catalog as Catalog;
			const { updatedAt, ...rest } = catalog;
			const catalogEntries = Object.values(rest).flat(1);
			const firstEntry = catalogEntries[0];

			const plan: Plan = {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				directoryName: 'integration',
				isExpanded: true,
				games: [
					{
						directoryName: 'foo',
						isExpanded: true,
						games: [
							{
								directoryName: 'bar',
								isExpanded: true,
								games: [
									{
										db_id: firstEntry.db_id,
										relFilePath: firstEntry.files.mra.relFilePath,
									},
								],
							},
						],
					},
				],
			};

			const exportDir = path.resolve(TMP_DIR, 'exported-plan');

			const exportCallback = jest.fn().mockReturnValue(true);
			await exportToDirectory(plan, exportDir, exportCallback);

			await assertExportedMras(
				path.resolve(exportDir, '_Arcade'),
				plan.games,
				catalogEntries
			);

			await assertNoEmptyMraDirectories(path.resolve(exportDir, '_Arcade'));
			await assertNoExtraRbfsBeyondPlan(
				path.resolve(exportDir, '_Arcade', 'cores'),
				plan,
				catalogEntries
			);

			await assertExportedRbfsFromPlan(
				path.resolve(exportDir, '_Arcade', 'cores'),
				plan.games,
				catalogEntries
			);

			await assertExportLog(TMP_DIR);
		});

		it('should clean up a previous export', async function () {
			const updateCatalogCallback = jest.fn().mockReturnValue(true);
			await updateCatalog(updateCatalogCallback);

			const catalog = updateCatalogCallback.mock.lastCall?.[0]
				.catalog as Catalog;
			const { updatedAt, ...rest } = catalog;
			const catalogEntries = Object.values(rest).flat(1);
			const firstEntry = catalogEntries[0];

			const firstPlan: Plan = {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				directoryName: 'integration',
				isExpanded: true,
				games: [
					{
						directoryName: 'foo',
						isExpanded: true,
						games: [
							{
								directoryName: 'bar',
								isExpanded: true,
								games: [
									{
										db_id: firstEntry.db_id,
										relFilePath: firstEntry.files.mra.relFilePath,
									},
								],
							},
						],
					},
				],
			};

			const exportDir = path.resolve(TMP_DIR, 'exported-plan');

			const exportCallback = jest.fn().mockReturnValue(true);
			await exportToDirectory(firstPlan, exportDir, exportCallback);

			const secondPlan: Plan = {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				directoryName: 'integration',
				isExpanded: true,
				games: [
					{
						db_id: firstEntry.db_id,
						relFilePath: firstEntry.files.mra.relFilePath,
					},
				],
			};

			await exportToDirectory(secondPlan, exportDir, exportCallback);

			await assertExportedMras(
				path.resolve(exportDir, '_Arcade'),
				secondPlan.games,
				catalogEntries
			);

			await assertNoEmptyMraDirectories(path.resolve(exportDir, '_Arcade'));

			await assertExportedRbfsFromPlan(
				path.resolve(exportDir, '_Arcade', 'cores'),
				secondPlan.games,
				catalogEntries
			);
		});

		// This was added to confirm Jotego's cores (which lack the date in their name) still work,
		// the first stab at handling this caused ambiguous export operations, so would delete cores
		// that should not be deleted
		it('should successfully export the same plan with Jotego games multiple times', async function () {
			// @ts-expect-error doesnt know it is a mock
			getSetting.mockImplementation((settingKey: keyof Settings) => {
				switch (settingKey) {
					case 'rootDir':
						return Promise.resolve(TMP_DIR);
					case 'downloadRoms':
						return Promise.resolve(false);
					case 'updateDbs': {
						const updateDbs = defaultUpdateDbs.map((udb) => {
							return {
								...udb,
								enabled: udb.db_id === 'jtcores',
							};
						});

						return Promise.resolve(updateDbs);
					}
					case 'exportOptimization':
						return Promise.resolve('space');
					default:
						return Promise.resolve('mock-setting');
				}
			});

			const updateCatalogCallback = jest.fn().mockReturnValue(true);
			await updateCatalog(updateCatalogCallback);

			const catalog = updateCatalogCallback.mock.lastCall?.[0]
				.catalog as Catalog;
			const { updatedAt, ...rest } = catalog;
			const catalogEntries = Object.values(rest).flat(1);
			const firstEntry = catalogEntries[0];

			const plan: Plan = {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				directoryName: 'integration',
				isExpanded: true,
				games: [
					{
						directoryName: 'foo',
						isExpanded: true,
						games: [
							{
								directoryName: 'bar',
								isExpanded: true,
								games: [
									{
										db_id: firstEntry.db_id,
										relFilePath: firstEntry.files.mra.relFilePath,
									},
								],
							},
						],
					},
				],
			};

			const exportDir = path.resolve(TMP_DIR, 'exported-plan');

			const exportCallback = jest.fn().mockReturnValue(true);

			for (let i = 0; i < 3; ++i) {
				await exportToDirectory(plan, exportDir, exportCallback);

				await assertExportedMras(
					path.resolve(exportDir, '_Arcade'),
					plan.games,
					catalogEntries
				);

				await assertNoEmptyMraDirectories(path.resolve(exportDir, '_Arcade'));
				await assertNoExtraRbfsBeyondPlan(
					path.resolve(exportDir, '_Arcade', 'cores'),
					plan,
					catalogEntries
				);

				await assertExportedRbfsFromPlan(
					path.resolve(exportDir, '_Arcade', 'cores'),
					plan.games,
					catalogEntries
				);

				await assertExportLog(TMP_DIR);
			}
		}, 30000);
	});

	describe('speed exports', function () {
		beforeAll(function () {
			// @ts-expect-error doesnt know it is a mock
			getSetting.mockImplementation((settingKey: keyof Settings) => {
				switch (settingKey) {
					case 'rootDir':
						return Promise.resolve(TMP_DIR);
					case 'downloadRoms':
						return Promise.resolve(false);
					case 'updateDbs': {
						const updateDbs = defaultUpdateDbs.map((udb) => {
							return {
								...udb,
								enabled: udb.db_id === 'theypsilon_unofficial_distribution',
							};
						});

						return Promise.resolve(updateDbs);
					}
					case 'exportOptimization':
						return Promise.resolve('speed');
					default:
						return Promise.resolve('mock-setting');
				}
			});
		});

		it('should do a speed export', async function () {
			const updateCatalogCallback = jest.fn().mockReturnValue(true);
			await updateCatalog(updateCatalogCallback);

			const catalog = updateCatalogCallback.mock.lastCall?.[0]
				.catalog as Catalog;
			const { updatedAt, ...rest } = catalog;
			const catalogEntries = Object.values(rest).flat(1);

			const firstPlan: Plan = {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				directoryName: 'integration',
				isExpanded: true,
				games: [],
			};

			const exportDir = path.resolve(TMP_DIR, 'exported-plan');

			const exportCallback = jest.fn().mockReturnValue(true);
			await exportToDirectory(firstPlan, exportDir, exportCallback);

			await assertAllRbfsFromCatalogGotExported(
				path.resolve(exportDir, '_Arcade', 'cores'),
				catalogEntries
			);
		});
	});
});
