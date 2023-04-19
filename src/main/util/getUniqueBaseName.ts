import path from 'node:path';

/**
 * This is used to populate the recent plans menu. It's just a way to show
 * a short representation of the plan in the menu.
 *
 * NOTE: for path, native node:path should be used as these are OS specific paths
 */
function getUniqueBaseName(filePath: string, allPaths: string[]): string {
	// TODO: if two plans have the same file name, how can we get a succinct unique string here?
	return path.basename(filePath);
}

export { getUniqueBaseName };
