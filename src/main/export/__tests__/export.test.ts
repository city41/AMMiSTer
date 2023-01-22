import path from 'node:path';
import { Mock } from 'ts-mockery';
import {
	buildFileOperations,
	buildDestFileOperationPath,
	doExport,
} from '../export';
import {
	SrcFileOperationPath,
	DestFileOperationPath,
	FileClient,
} from '../types';
import { Plan } from '../../plan/types';
import { Catalog, CatalogEntry } from '../../catalog/types';
import { Settings } from '../../settings/types';
import * as settings from '../../settings';
import * as catalog from '../../catalog';

const getSettingMock = jest.fn().mockResolvedValue('mock-setting');

jest.mock('node:fs', () => {
	return {
		createReadStream: jest.fn().mockReturnValue(''),
	};
});
jest.mock('node:fs/promises', () => {
	return {
		readdir: jest.fn().mockResolvedValue([]),
		readFile: jest.fn().mockResolvedValue(''),
		writeFile: jest.fn().mockResolvedValue(''),
	};
});
jest.mock('winston', () => {
	return {
		format: {
			errors: jest.fn(),
			metadata: jest.fn(),
			json: jest.fn(),
			combine: jest.fn(),
		},
		createLogger: jest.fn().mockReturnValue({
			debug: jest.fn(),
			info: jest.fn(),
			error: jest.fn(),
			child: jest.fn().mockReturnValue({
				debug: jest.fn(),
				info: jest.fn(),
				error: jest.fn(),
			}),
			close: jest.fn(),
		}),
		transports: {
			File: jest.fn(),
		},
	};
});

jest.mock('../../settings', () => {
	return {
		getSetting: jest.fn().mockResolvedValue('mock-setting'),
	};
});

jest.mock('../../catalog', () => {
	return {
		getCurrentCatalog: jest.fn().mockResolvedValue({}),
	};
});

describe('export', function () {
	describe('#buildFileOperations', function () {
		describe('exact ops', function () {
			it('should return zero operations if src and dest are the same (no mras)', function () {
				const srcOpPaths: SrcFileOperationPath[] = [
					{
						type: 'dated-filename',
						db_id: 'mockdb',
						cacheRelDirPath: '_Arcade/cores',
						destRelDirPath: '_Arcade/cores',
						fileName: 'foo_20230101',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				const destOpPaths: DestFileOperationPath[] = [
					{
						type: 'dated-filename',
						relDirPath: '_Arcade/cores',
						fileName: 'foo_20230101',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				expect(buildFileOperations(srcOpPaths, destOpPaths, path.join)).toEqual(
					[]
				);
			});

			it('should return copy operations if src and dest are the same (with mras)', function () {
				const srcOpPaths: SrcFileOperationPath[] = [
					{
						type: 'exact',
						db_id: 'mockdb',
						cacheRelPath: '_Arcade/foo.mra',
						destRelPath: '_Arcade/sub/dir/foo.mra',
					},
					{
						type: 'dated-filename',
						db_id: 'mockdb',
						cacheRelDirPath: '_Arcade/cores',
						destRelDirPath: '_Arcade/cores',
						fileName: 'foo_20230101',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				const destOpPaths: DestFileOperationPath[] = [
					{
						type: 'exact',
						db_id: 'mockdb',
						relPath: '_Arcade/sub/dir/foo.mra',
					},
					{
						type: 'dated-filename',
						relDirPath: '_Arcade/cores',
						fileName: 'foo_20230101',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				expect(buildFileOperations(srcOpPaths, destOpPaths, path.join)).toEqual(
					[
						{
							action: 'copy',
							destPath: '_Arcade/sub/dir/foo.mra',
							srcPath: 'mockdb/_Arcade/foo.mra',
						},
					]
				);
			});

			it('should return a copy if src has a file that dest does not', function () {
				const srcOpPaths: SrcFileOperationPath[] = [
					{
						type: 'exact',
						db_id: 'mockdb',
						cacheRelPath: '_Arcade/foo.mra',
						destRelPath: '_Arcade/foo.mra',
					},
				];

				const destOpPaths: DestFileOperationPath[] = [];

				expect(buildFileOperations(srcOpPaths, destOpPaths, path.join)).toEqual(
					[
						{
							action: 'copy',
							srcPath: 'mockdb/_Arcade/foo.mra',
							destPath: '_Arcade/foo.mra',
						},
					]
				);
			});

			it('should return a delete if dest has a file that src does not', function () {
				const srcOpPaths: SrcFileOperationPath[] = [];

				const destOpPaths: DestFileOperationPath[] = [
					{
						type: 'exact',
						relPath: '_Arcade/foo.mra',
					},
				];

				expect(buildFileOperations(srcOpPaths, destOpPaths, path.join)).toEqual(
					[
						{
							action: 'delete',
							destPath: '_Arcade/foo.mra',
						},
					]
				);
			});

			it('should return unique file operations regardless of dupes in input', function () {
				const srcOpPaths: SrcFileOperationPath[] = [];

				const destOpPaths: DestFileOperationPath[] = [
					{
						type: 'exact',
						relPath: '_Arcade/foo.mra',
					},
					{
						type: 'exact',
						relPath: '_Arcade/foo.mra',
					},
				];

				expect(buildFileOperations(srcOpPaths, destOpPaths, path.join)).toEqual(
					[
						{
							action: 'delete',
							destPath: '_Arcade/foo.mra',
						},
					]
				);
			});
		});

		describe('dated ops', function () {
			it('should leave dest alone if src is older', function () {
				const srcOpPaths: SrcFileOperationPath[] = [
					{
						type: 'dated-filename',
						db_id: 'mockdb',
						cacheRelDirPath: '_Arcade/cores',
						destRelDirPath: '_Arcade/cores',
						fileName: 'foo_20230101.rbf',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				const destOpPaths: DestFileOperationPath[] = [
					{
						type: 'dated-filename',
						relDirPath: '_Arcade/cores',
						fileName: 'foo_20230102.rbf',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-02'),
					},
				];

				expect(buildFileOperations(srcOpPaths, destOpPaths, path.join)).toEqual(
					[]
				);
			});

			it('should copy src and delete dest if dest is older', function () {
				const srcOpPaths: SrcFileOperationPath[] = [
					{
						type: 'dated-filename',
						db_id: 'mockdb',
						cacheRelDirPath: '_Arcade/cores',
						destRelDirPath: '_Arcade/cores',
						fileName: 'foo_20230102.rbf',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-02'),
					},
				];

				const destOpPaths: DestFileOperationPath[] = [
					{
						type: 'dated-filename',
						relDirPath: '_Arcade/cores',
						fileName: 'foo_20230101.rbf',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				expect(buildFileOperations(srcOpPaths, destOpPaths, path.join)).toEqual(
					[
						{
							action: 'copy',
							srcPath: 'mockdb/_Arcade/cores/foo_20230102.rbf',
							destPath: '_Arcade/cores/foo_20230102.rbf',
						},
						{
							action: 'delete',
							destPath: '_Arcade/cores/foo_20230101.rbf',
						},
					]
				);
			});
		});
	});

	describe('#buildFileOperationPath', function () {
		it('should return exact file paths as exact file operation path', function () {
			expect(buildDestFileOperationPath('_Arcade/foo.mra')).toEqual({
				type: 'exact',
				relPath: '_Arcade/foo.mra',
			});
		});

		it('should return dated file paths as dated-filename file operation path', function () {
			expect(
				buildDestFileOperationPath('_Arcade/cores/foo_20230101.mra')
			).toEqual({
				type: 'dated-filename',
				relDirPath: '_Arcade/cores',
				fileName: 'foo_20230101.mra',
				fileNameBase: 'foo',
				extension: '.mra',
				date: new Date('2023-01-01'),
			});
		});

		it('should return a file path that looks like it is dated but is invalid as exact', function () {
			expect(
				buildDestFileOperationPath('_Arcade/cores/foo_21111111.mra')
			).toEqual({
				type: 'exact',
				relPath: '_Arcade/cores/foo_21111111.mra',
			});

			expect(buildDestFileOperationPath('_Arcade/cores/foo_2111.mra')).toEqual({
				type: 'exact',
				relPath: '_Arcade/cores/foo_2111.mra',
			});

			// date is 9 chars, one too long
			expect(
				buildDestFileOperationPath('_Arcade/cores/foo_212345678.mra')
			).toEqual({
				type: 'exact',
				relPath: '_Arcade/cores/foo_212345678.mra',
			});

			expect(
				buildDestFileOperationPath('_Arcade/cores/farInTheFuture_30230101.mra')
			).toEqual({
				type: 'exact',
				relPath: '_Arcade/cores/farInTheFuture_30230101.mra',
			});
		});
	});

	describe('doExport', function () {
		it('should do a very basic export', async function () {
			const plan = Mock.of<Plan>({
				directoryName: 'mock plan',
				games: [
					Mock.of<CatalogEntry>({
						db_id: 'mock_db',
						files: {
							mra: {
								db_id: 'mock_db',
								type: 'mra',
								relFilePath: '_Arcade/foo.mra',
								fileName: 'foo.mra',
							} as const,
							roms: [],
						},
					}),
				],
			});

			// return true to indicate we don't want to cancel
			const callback = jest.fn().mockReturnValue(true);

			const mockClient = Mock.of<FileClient>({
				connect: jest.fn().mockResolvedValue(''),
				disconnect: jest.fn().mockResolvedValue(''),
				getMountPath: jest.fn().mockReturnValue(''),
				getDestinationPathJoiner: jest.fn().mockReturnValue(path.join),
				mkDir: jest.fn().mockResolvedValue(''),
				listDir: jest.fn().mockResolvedValue(''),
				putFile: jest.fn().mockResolvedValue(''),
			});

			const clientFactory = () => mockClient;

			await doExport(plan, callback, 'unit-tests', 'mister', clientFactory);

			const callbackMessages = callback.mock.calls.map((c) => c[0].message);

			expect(callbackMessages).toEqual([
				'Connecting...',
				'Determining what needs to be copied...',
				'Copying: _Arcade/foo.mra',
				'Cleaning up empty directories',
				'Export complete in 0.00 seconds',
			]);
		});

		it('should do a speed optimized export', async function () {
			// settings.getSetting = jest
			// 	.fn()
			// 	.mockImplementation((key: keyof Settings) => {
			// 		if (key === 'exportOptimization') {
			// 			return 'speed';
			// 		}
			// 		return 'mock-setting';
			// 	});
		});
	});
});
