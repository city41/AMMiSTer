import fsp from 'node:fs/promises';
import path from 'node:path';
import * as settings from '../settings';

const GAME_CACHE_DIR = 'gameCache';

/**
 * Returns the root directory of the game cache, or throws
 * if called before it has been established
 *
 * NOTE: The returned path is absolute and OS specific
 */
export async function getGameCacheDir(): Promise<string> {
	const rootDir = await settings.getSetting('rootDir');

	if (!rootDir) {
		throw new Error('db#getGameCacheDir: rootDir is not set in settings');
	}

	// we want an OS specific path, so using the main path.resolve
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

	if (
		d.getFullYear() < 2020 ||
		d.getFullYear() > new Date().getFullYear() ||
		isNaN(d.getTime())
	) {
		return null;
	}

	return d;
}

export async function exists(filePath: string): Promise<boolean> {
	try {
		return (await fsp.stat(filePath)).isFile();
	} catch {
		return false;
	}
}

export async function size(filePath: string): Promise<number> {
	try {
		return (await fsp.stat(filePath)).size;
	} catch {
		return 0;
	}
}
