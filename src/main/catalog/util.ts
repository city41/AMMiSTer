import { CatalogEntry } from './types';

export function isCatalogEntry(obj: unknown): obj is CatalogEntry {
	if (!obj) {
		return false;
	}

	const ce = obj as CatalogEntry;

	if (typeof ce.db_id !== 'string') {
		return false;
	}

	if (typeof ce.gameName !== 'string') {
		return false;
	}

	return true;
}
