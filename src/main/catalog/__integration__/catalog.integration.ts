import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { Settings } from '../../settings/types';
import { defaultUpdateDbs } from '../../settings/defaultUpdateDbs';
import { updateCatalog } from '../catalog';
import { Catalog } from '../types';
import { exists } from '../../util/fs';

const TMP_DIR = path.resolve(os.tmpdir(), 'ammister-integration-tests-catalog');
// ten minutes
const INTEGRATION_TIMEOUT = 10 * 60 * 1000;

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

describe('catalog integration', function () {
	beforeEach(async function () {
		return fsp.rm(TMP_DIR, { force: true, recursive: true, retryDelay: 1000 });
	});

	it(
		'should update with one enabled db',
		async function () {
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

			const catalog = lastCallArgs.catalog as Catalog;
			const entries = catalog['theypsilon_unofficial_distribution'];
			expect(entries).toHaveLength(1);

			const mra = entries[0].files.mra;
			expect(mra.status).toBe('ok');

			const mraPath = path.resolve(
				TMP_DIR,
				'gameCache',
				mra.db_id,
				mra.relFilePath
			);
			const mraExists = await exists(mraPath);
			expect(mraExists).toBe(true);

			const rbf = entries[0].files.rbf;
			expect(rbf?.status).toBe('ok');

			const rbfPath = path.resolve(
				TMP_DIR,
				'gameCache',
				rbf!.db_id,
				rbf!.relFilePath
			);
			const rbfExists = await exists(rbfPath);
			expect(rbfExists).toBe(true);

			// should not have downloaded any roms
			expect(entries[0].files.roms).toHaveLength(1);
			const rom = entries[0].files.roms[0];
			expect(rom?.status).toBe('missing');

			const romPath = path.resolve(
				TMP_DIR,
				'gameCache',
				rom!.db_id,
				rom!.relFilePath
			);

			const romExists = await exists(romPath);
			expect(romExists).toBe(false);
		},
		INTEGRATION_TIMEOUT
	);
});
