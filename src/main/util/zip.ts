import os from 'node:os';
import path from 'node:path';
import decompress from 'decompress';
import mkdirp from 'mkdirp';

async function extractZipFileToPath(filePath: string): Promise<string[]> {
	const tmpDir = path.resolve(os.tmpdir(), 'ammister', `unzip-${Date.now()}`);
	await mkdirp(tmpDir);

	const files = await decompress(filePath, tmpDir);

	return files.map((f) => path.resolve(tmpDir, f.path));
}

export { extractZipFileToPath };
