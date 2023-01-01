import { CatalogEntry } from '../catalog/types';

export type PlanGameDirectory = Array<CatalogEntry | PlanGameDirectoryEntry>;

export type PlanGameDirectoryEntry = {
	directoryName: string;
	isExpanded: boolean;
	games: PlanGameDirectory;
};

export type Plan = {
	directoryName: string;
	isExpanded: boolean;
	createdAt: number;
	updatedAt: number;
	games: PlanGameDirectory;
};
