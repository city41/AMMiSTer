import { CatalogEntry, HashedCatalogFileEntry } from '../catalog/types';

// Common Plan types
// both serialized and hydrated use this type

// Plan types
// this is a fully hydrated plan being used by the app

export type LegacyPlanGameDirectory = Array<
	CatalogEntry | LegacyPlanGameDirectoryEntry
>;

export type LegacyPlanGameDirectoryEntry = {
	directoryName: string;
	isExpanded: boolean;
	games: LegacyPlanGameDirectory;
	hasAnInvalidDescendant?: boolean;
};

export type LegacyPlan = LegacyPlanGameDirectoryEntry & {
	createdAt: number;
	updatedAt: number;
};

// Serialized Plan Types
// This is a serialized plan, where the only thing about a game that is saved
// is the path to its mra file inside the gameCache dir
//
// There are two types because plans should not "capture" catalog state. As
// the catalog changes due to updates, the plan should just use the latest
// versions of games from the catalog

export type PlanGameEntry = Pick<
	HashedCatalogFileEntry,
	'db_id' | 'relFilePath'
> & { missing?: boolean };

export type PlanGameDirectoryEntry = {
	directoryName: string;
	isExpanded: boolean;
	games: PlanGameDirectory;
	hasAnInvalidDescendant?: boolean;
};

export type PlanGameDirectory = Array<PlanGameEntry | PlanGameDirectoryEntry>;

export type Plan = PlanGameDirectoryEntry & {
	createdAt: number;
	updatedAt: number;
};
