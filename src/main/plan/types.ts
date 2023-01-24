import { CatalogEntry } from '../catalog/types';

export type PlanGameDirectory = Array<CatalogEntry | PlanGameDirectoryEntry>;

export type PlanGameDirectoryEntry = {
	directoryName: string;
	isExpanded: boolean;
	games: PlanGameDirectory;
	hasAnInvalidDescendant?: boolean;
};

export type Plan = PlanGameDirectoryEntry & {
	createdAt: number;
	updatedAt: number;
};
