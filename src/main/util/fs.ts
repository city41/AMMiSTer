import path from 'node:path';
import settings from 'electron-settings';

const GAME_CACHE_DIR = 'gameCache';

/**
 * Returns the root directory of the game cache, or throws
 * if called before it has been established
 */
export async function getGameCacheDir(): Promise<string> {
	const rootDir = await settings.get('rootDir');

	if (!rootDir) {
		throw new Error('db#getGameCacheDir: rootDir is not set in settings');
	}

	return path.resolve(rootDir.toString(), GAME_CACHE_DIR);
}

export function convertFileNameDate(
	str: string | null | undefined
): Date | null {
	if (!str || str.trim().length !== 8 || !str.startsWith('20')) {
		return null;
	}

	const chars = str.split('');
	const withDashes = [
		...chars.slice(0, 4),
		'-',
		...chars.slice(4, 6),
		'-',
		...chars.slice(6),
	].join('');

	const d = new Date(withDashes);
	return d;
}

export function misterPathJoiner(...segments: string[]): string {
	const result = path.join(...segments);

	if (process.platform !== 'win32') {
		return result;
	} else {
		// convert all \ to /
		const cleanedResult = result.replace(/\\/g, '/');

		// incoming path was unix absolute? make it unix absolute again,
		// which the windows version of path.join will strip
		if (segments[0]?.startsWith('/')) {
			return '/' + cleanedResult;
		} else {
			return cleanedResult;
		}
	}
}
