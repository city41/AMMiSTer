import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { Settings } from '../../settings/types';
import { defaultUpdateDbs } from '../../settings/defaultUpdateDbs';
import { updateCatalog } from '../catalog';
import { Catalog } from '../types';
import { exists } from '../../util/fs';

const TMP_DIR = path.resolve(os.tmpdir(), 'ammister-integration-tests-catalog');

jest.mock('../../settings', () => {
	return {
		getSetting: jest.fn().mockImplementation((settingKey: keyof Settings) => {
			switch (settingKey) {
				case 'rootDir':
					return Promise.resolve(TMP_DIR);
				case 'downloadRoms':
					return Promise.resolve(false);
				case 'updateDbs': {
					const updateDbs = defaultUpdateDbs.map((udb, i, a) => {
						return {
							...udb,
							enabled: i === a.length - 1,
						};
					});

					return Promise.resolve(updateDbs);
				}
				default:
					return Promise.resolve('mock-setting');
			}
		}),
	};
});

async function assertCatalog(catalog: Catalog) {
	const { updatedAt, ...restOfCatalog } = catalog;

	expect(typeof updatedAt).toBe('number');

	const atLeastOneDbInCatalog = defaultUpdateDbs.find(
		(udb) => !!catalog[udb.db_id]
	);
	expect(!!atLeastOneDbInCatalog).toBe(true);

	const entries = Object.values(restOfCatalog).flat(1);

	for (const entry of entries) {
		const mra = entry.files.mra;
		expect(mra.status).toBe('ok');

		const mraPath = path.resolve(
			TMP_DIR,
			'gameCache',
			mra.db_id,
			mra.relFilePath
		);
		const mraExists = await exists(mraPath);
		expect(mraExists).toBe(true);

		const rbf = entry.files.rbf;
		expect(rbf?.status).toBe('ok');

		const rbfPath = path.resolve(
			TMP_DIR,
			'gameCache',
			rbf!.db_id,
			rbf!.relFilePath
		);
		const rbfExists = await exists(rbfPath);
		expect(rbfExists).toBe(true);

		// should not have downloaded any roms, but their
		// metadata should still be in the catalog
		expect(entry.files.roms.length).toBeGreaterThan(0);
		for (const rom of entry.files.roms) {
			expect(rom?.status).toBe('missing');

			const romPath = path.resolve(
				TMP_DIR,
				'gameCache',
				rom!.db_id,
				rom!.relFilePath
			);

			const romExists = await exists(romPath);
			expect(romExists).toBe(false);
		}
	}
}

async function changeFirstMra(catalog: Catalog) {
	const { updatedAt, ...restOfCatalog } = catalog;

	expect(typeof updatedAt).toBe('number');

	const atLeastOneDbInCatalog = defaultUpdateDbs.find(
		(udb) => !!catalog[udb.db_id]
	);
	expect(!!atLeastOneDbInCatalog).toBe(true);

	const entries = Object.values(restOfCatalog).flat(1);

	expect(entries.length).toBeGreaterThan(0);

	const mra = entries[0].files.mra;

	const mraPath = path.resolve(
		TMP_DIR,
		'gameCache',
		mra.db_id,
		mra.relFilePath
	);

	await fsp.writeFile(
		mraPath,
		'Changing the mra so hash changes, forcing an update'
	);
}

describe('catalog integration', function () {
	beforeAll(async function () {
		return fsp.rm(TMP_DIR, { force: true, recursive: true, retryDelay: 1000 });
	});

	afterEach(async function () {
		return fsp.rm(TMP_DIR, { force: true, recursive: true, retryDelay: 1000 });
	});

	it('should do a fresh update', async function () {
		const callback = jest.fn().mockReturnValue(true);
		await updateCatalog(callback);

		expect(callback).toHaveBeenNthCalledWith(1, {
			fresh: true,
			message: 'Getting the latest MiSTer Arcade Database...',
		});
		expect(callback).toHaveBeenNthCalledWith(2, {
			fresh: true,
			message: 'Checking for anything new in The Ypsilon Unofficial',
		});
		expect(callback).toHaveBeenNthCalledWith(callback.mock.calls.length - 1, {
			fresh: true,
			message: 'Added Nemesis (ROM version) to catalog',
		});

		const lastCallArgs = callback.mock.lastCall?.[0];
		expect(lastCallArgs.complete).toBe(true);
		expect(lastCallArgs.updates).toHaveLength(2);
		expect(lastCallArgs.message).toBe('Update finished');

		const catalog = lastCallArgs.catalog as Catalog;
		await assertCatalog(catalog);
	});

	it('should not download anything if the second update has nothing new', async function () {
		const callback = jest.fn().mockReturnValue(true);
		await updateCatalog(callback);

		callback.mockClear();

		await updateCatalog(callback);

		expect(callback).toHaveBeenNthCalledWith(1, {
			fresh: false,
			message: 'Getting the latest MiSTer Arcade Database...',
		});
		expect(callback).toHaveBeenNthCalledWith(2, {
			fresh: false,
			message: 'Checking for anything new in The Ypsilon Unofficial',
		});

		const lastCallArgs = callback.mock.lastCall?.[0];
		expect(lastCallArgs.complete).toBe(true);
		expect(lastCallArgs.updates).toHaveLength(0);
		expect(lastCallArgs.message).toBe('No updates available');

		const catalog = lastCallArgs.catalog as Catalog;
		await assertCatalog(catalog);
	});

	it('should redownload a file if it was updated', async function () {
		const callback = jest.fn().mockReturnValue(true);
		await updateCatalog(callback);

		const lastCallArgs = callback.mock.lastCall?.[0];
		const catalog = lastCallArgs.catalog as Catalog;

		await changeFirstMra(catalog);

		callback.mockClear();

		await updateCatalog(callback);

		expect(callback).toHaveBeenNthCalledWith(1, {
			fresh: false,
			message: 'Getting the latest MiSTer Arcade Database...',
		});
		expect(callback).toHaveBeenNthCalledWith(2, {
			fresh: false,
			message: 'Checking for anything new in The Ypsilon Unofficial',
		});
		expect(callback).toHaveBeenNthCalledWith(3, {
			fresh: false,
			message: 'Updating Nemesis (ROM Version).mra',
		});

		const lastCallArgs2 = callback.mock.lastCall?.[0];
		expect(lastCallArgs2.complete).toBe(true);
		expect(lastCallArgs2.updates).toHaveLength(1);
		expect(lastCallArgs2.message).toBe('Update finished');

		const catalog2 = lastCallArgs2.catalog as Catalog;
		await assertCatalog(catalog2);
	});
});