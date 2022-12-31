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
