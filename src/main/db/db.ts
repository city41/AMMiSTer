import os from 'node:os';
import path from 'node:path';
import mkdirp from 'mkdirp';

import { downloadFile } from '../util/network';
import { extractZipFileToPath } from '../util/zip';

type DBJSON = {};

/**
 * Pulls down the db file from the given url. Most db files are zipped,
 * so will also unzip it if so
 */
async function getUpdateJson(url: string): Promise<DBJSON> {
	const tmpDir = path.resolve(os.tmpdir(), 'ammister');
	await mkdirp(tmpDir);

	const fileName = path.basename(url);
	const filePath = path.resolve(tmpDir, fileName);

	await downloadFile(url, filePath);

	const fileExt = path.extname(url);

	if (fileExt === '.json') {
		return require(filePath) as DBJSON;
	}

	const extractedJsonPaths = await extractZipFileToPath(filePath);
	return require(extractedJsonPaths[0]) as DBJSON;
}

export { getUpdateJson };
