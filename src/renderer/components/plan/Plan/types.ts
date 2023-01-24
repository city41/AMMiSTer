import { PlanGameDirectory } from 'src/main/plan/types';

export type PlanTreeItem = {
	id: string;
	parentPath: string[];
	immediateGameCount: number;
	totalGameCount: number;
	entries: PlanGameDirectory;
	isDirty?: boolean;
	hasInvalidDescendant?: boolean;
};
