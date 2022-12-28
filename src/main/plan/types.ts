import { CatalogEntry } from '../catalog/types';

export type PlanGameDirectory = Array<CatalogEntry | PlanGameDirectoryEntry>;

export type PlanGameDirectoryEntry = {
	directoryName: string;
	games: PlanGameDirectory;
};

export type Plan = {
	name: string;
	createdAt: number;
	updatedAt: number;
	games: PlanGameDirectory;
};
