import { UpdateDbConfig } from '../settings/types';
import { Catalog, CatalogEntry } from './types';

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

export function getCatalogEntryForMraPath(
	db_id: string,
	mraPath: string,
	catalog: Catalog,
	updateDbConfigs: UpdateDbConfig[]
): CatalogEntry | undefined {
	const updateDbConfig = updateDbConfigs.find((udb) => udb.db_id === db_id);

	if (updateDbConfig?.enabled) {
		const db = catalog[db_id] ?? [];

		return db.find((ce) => ce.files.mra.relFilePath === mraPath);
	}
}

export function getAllCatalogEntries(catalog: Catalog): CatalogEntry[] {
	const { updatedAt, ...restOfCatalog } = catalog;

	return Object.values(restOfCatalog).flat(1);
}
