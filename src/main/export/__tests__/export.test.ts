import { buildFileOperations, buildFileOperationPath } from '../export';
import { FileOperationPath } from '../types';

describe('export', function () {
	describe('#buildFileOperations', function () {
		describe('exact ops', function () {
			it('should return zero operations if src and dest are the same', function () {
				const srcOpPaths: FileOperationPath[] = [
					{
						type: 'exact',
						db_id: 'mockdb',
						relPath: '_Arcade/foo.mra',
					},
					{
						type: 'exact',
						db_id: 'mockdb',
						relPath: 'games/mame/foo.zip',
					},
					{
						type: 'dated-filename',
						db_id: 'mockdb',
						relDirPath: '_Arcade/cores',
						fileName: 'foo_20230101',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				const destOpPaths = srcOpPaths.map((s) => ({ ...s }));

				expect(buildFileOperations(srcOpPaths, destOpPaths)).toEqual([]);
			});

			it('should return a copy if src has a file that dest does not', function () {
				const srcOpPaths: FileOperationPath[] = [
					{
						type: 'exact',
						db_id: 'mockdb',
						relPath: '_Arcade/foo.mra',
					},
				];

				const destOpPaths: FileOperationPath[] = [];

				expect(buildFileOperations(srcOpPaths, destOpPaths)).toEqual([
					{
						action: 'copy',
						srcPath: 'mockdb/_Arcade/foo.mra',
						destPath: '_Arcade/foo.mra',
					},
				]);
			});

			it('should return a delete if dest has a file that src does not', function () {
				const srcOpPaths: FileOperationPath[] = [];

				const destOpPaths: FileOperationPath[] = [
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
				const srcOpPaths: FileOperationPath[] = [];

				const destOpPaths: FileOperationPath[] = [
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
				const srcOpPaths: FileOperationPath[] = [
					{
						type: 'dated-filename',
						db_id: 'mockdb',
						relDirPath: '_Arcade/cores',
						fileName: 'foo_20230101.rbf',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-01'),
					},
				];

				const destOpPaths: FileOperationPath[] = [
					{
						type: 'dated-filename',
						relDirPath: '_Arcade/cores',
						fileName: 'foo_20230102.rbf',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-02'),
					},
				];

				expect(buildFileOperations(srcOpPaths, destOpPaths)).toEqual([]);
			});

			it('should copy src and delete dest if dest is older', function () {
				const srcOpPaths: FileOperationPath[] = [
					{
						type: 'dated-filename',
						db_id: 'mockdb',
						relDirPath: '_Arcade/cores',
						fileName: 'foo_20230102.rbf',
						fileNameBase: 'foo',
						extension: '.rbf',
						date: new Date('2023-01-02'),
					},
				];

				const destOpPaths: FileOperationPath[] = [
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
			expect(buildFileOperationPath('_Arcade/foo.mra')).toEqual({
				type: 'exact',
				relPath: '_Arcade/foo.mra',
			});
		});

		it('should return dated file paths as dated-filename file operation path', function () {
			expect(buildFileOperationPath('_Arcade/cores/foo_20230101.mra')).toEqual({
				type: 'dated-filename',
				relDirPath: '_Arcade/cores',
				fileName: 'foo_20230101.mra',
				fileNameBase: 'foo',
				extension: '.mra',
				date: new Date('2023-01-01'),
			});
		});

		it('should return a file path that looks like it is dated but is invalid as exact', function () {
			expect(buildFileOperationPath('_Arcade/cores/foo_21111111.mra')).toEqual({
				type: 'exact',
				relPath: '_Arcade/cores/foo_21111111.mra',
			});

			expect(buildFileOperationPath('_Arcade/cores/foo_2111.mra')).toEqual({
				type: 'exact',
				relPath: '_Arcade/cores/foo_2111.mra',
			});

			// date is 9 chars, one too long
			expect(buildFileOperationPath('_Arcade/cores/foo_212345678.mra')).toEqual(
				{
					type: 'exact',
					relPath: '_Arcade/cores/foo_212345678.mra',
				}
			);

			expect(
				buildFileOperationPath('_Arcade/cores/farInTheFuture_30230101.mra')
			).toEqual({
				type: 'exact',
				relPath: '_Arcade/cores/farInTheFuture_30230101.mra',
			});
		});
	});
});
