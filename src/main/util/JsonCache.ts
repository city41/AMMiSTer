import path from 'node:path';
import fsp from 'node:fs/promises';
import settings from 'electron-settings';

type JsonValue = string | number | boolean;

class JsonCache<T extends JsonValue> {
	private initted = false;
	private cache: Record<string, T> = {};

	constructor(private fileName: string) {}

	async _cachePath() {
		const rootDir = await settings.get('rootDir');

		if (!rootDir) {
			throw new Error(`JsonCache: rootDir setting not found`);
		}

		return path.resolve(rootDir.toString(), this.fileName);
	}

	async init() {
		if (this.initted) {
			return;
		}

		this.initted = true;

		const cachepath = await this._cachePath();

		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			this.cache = require(cachepath) as Record<string, T>;
		} catch {
			this.cache = {};
		}
	}

	get(key: string): T | null {
		return this.cache[key] ?? null;
	}

	set(key: string, val: T): void {
		this.cache[key] = val;
	}

	async save() {
		const cachePath = await this._cachePath();
		const cacheJson = JSON.stringify(this.cache, null, 2);

		return fsp.writeFile(cachePath, cacheJson);
	}
}

export { JsonCache };
