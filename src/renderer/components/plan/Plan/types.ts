import { CatalogEntry } from '../../../../main/catalog/types';

export type PlanTreeItem = {
	isDirectory: boolean;
	parentPath: string[];
	db_id?: string;
	mraFileName?: string;
	catalogEntry?: CatalogEntry;
	totalGameCount?: number;
};
