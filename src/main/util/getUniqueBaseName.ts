import path from 'node:path';

function getUniqueBaseName(filePath: string, allPaths: string[]): string {
	// TODO: if two plans have the same file name, how can we get a succinct unique string here?
	return path.basename(filePath);
}

export { getUniqueBaseName };
