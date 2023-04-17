import { Mock } from 'ts-mockery';
import { buildFileOperations, buildDestFileOperationPath } from '../export';
import { SrcFileOperationPath, DestFileOperationPath } from '../types';
import { CatalogEntry } from 'src/main/catalog/types';
import { Settings, UpdateDbConfig } from 'src/main/settings/types';

jest.mock('../../settings', () => {
	return {
		getSetting: jest.fn().mockImplementation((settingKey: keyof Settings) => {
			if (settingKey === 'updateDbs') {
				return [
					{
						db_id: 'mock_db',
						enabled: true,
					},
				] as UpdateDbConfig[];
			} else {
				return 'mock-setting';
			}
		}),
	};
});

jest.mock('../../catalog', () => {
	return {
		getCurrentCatalog: jest.fn().mockResolvedValue({
			updatedAt: Date.now(),
			mock_db: [
				Mock.of<CatalogEntry>({
					db_id: 'mock_db',
					gameName: 'Mock game',
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
		}),
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

				expect(buildFileOperations(srcOpPaths, destOpPaths)).toEqual([]);
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

				expect(buildFileOperations(srcOpPaths, destOpPaths)).toEqual([
					{
						action: 'copy',
						destPath: '_Arcade/sub/dir/foo.mra',
						srcPath: 'mockdb/_Arcade/foo.mra',
					},
				]);
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

				expect(buildFileOperations(srcOpPaths, destOpPaths)).toEqual([
					{
						action: 'copy',
						srcPath: 'mockdb/_Arcade/foo.mra',
						destPath: '_Arcade/foo.mra',
					},
				]);
			});

			it('should return a delete if dest has a file that src does not', function () {
				const srcOpPaths: SrcFileOperationPath[] = [];

				const destOpPaths: DestFileOperationPath[] = [
					{
						type: 'exact',
						relPath: '_Arcade/foo.mra',
					},
				];

				expect(buildFileOperations(srcOpPaths, destOpPaths)).toEqual([
					{
						action: 'delete',
						destPath: '_Arcade/foo.mra',
					},
				]);
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

				expect(buildFileOperations(srcOpPaths, destOpPaths)).toEqual([
					{
						action: 'delete',
						destPath: '_Arcade/foo.mra',
					},
				]);
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

			it('should leave dest alone if src is older (multiple underscores)', function () {
				const srcOpPaths: SrcFileOperationPath[] = [
					{
						type: 'dated-filename',
						db_id: 'mockdb',
						cacheRelDirPath: '_Arcade/cores',
						destRelDirPath: '_Arcade/cores',
						fileName: 'foo_bar_20230101.rbf',
						fileNameBase: 'foo_bar',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				const destOpPaths: DestFileOperationPath[] = [
					{
						type: 'dated-filename',
						relDirPath: '_Arcade/cores',
						fileName: 'foo_bar_20230102.rbf',
						fileNameBase: 'foo_bar',
						extension: '.rbf',
						date: new Date('2023-01-02'),
					},
				];

				expect(buildFileOperations(srcOpPaths, destOpPaths, path.join)).toEqual(
					[]
				);
			});

			it('should leave dest alone if src is same age (multiple underscores)', function () {
				const srcOpPaths: SrcFileOperationPath[] = [
					{
						type: 'dated-filename',
						db_id: 'mockdb',
						cacheRelDirPath: '_Arcade/cores',
						destRelDirPath: '_Arcade/cores',
						fileName: 'foo_bar_20230101.rbf',
						fileNameBase: 'foo_bar',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				const destOpPaths: DestFileOperationPath[] = [
					{
						type: 'dated-filename',
						relDirPath: '_Arcade/cores',
						fileName: 'foo_bar_20230101.rbf',
						fileNameBase: 'foo_bar',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				expect(buildFileOperations(srcOpPaths, destOpPaths)).toEqual([]);
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

				expect(buildFileOperations(srcOpPaths, destOpPaths)).toEqual([
					{
						action: 'copy',
						srcPath: 'mockdb/_Arcade/cores/foo_20230102.rbf',
						destPath: '_Arcade/cores/foo_20230102.rbf',
					},
					{
						action: 'delete',
						destPath: '_Arcade/cores/foo_20230101.rbf',
					},
				]);
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
				buildDestFileOperationPath('_Arcade/cores/foo_20230101.rbf')
			).toEqual({
				type: 'dated-filename',
				relDirPath: '_Arcade/cores',
				fileName: 'foo_20230101.rbf',
				fileNameBase: 'foo',
				extension: '.rbf',
				date: new Date('2023-01-01'),
			});

			expect(
				buildDestFileOperationPath('_Arcade/cores/foo_bar__buz_20230101.rbf')
			).toEqual({
				type: 'dated-filename',
				relDirPath: '_Arcade/cores',
				fileName: 'foo_bar__buz_20230101.rbf',
				fileNameBase: 'foo_bar__buz',
				extension: '.rbf',
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

			expect(
				buildDestFileOperationPath('_Arcade/cores/foo_bar__buz_21111111.mra')
			).toEqual({
				type: 'exact',
				relPath: '_Arcade/cores/foo_bar__buz_21111111.mra',
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

	describe('doExport', function () {});
});
