import { PlanGameDirectory } from 'src/main/plan/types';

export type PlanTreeItem = {
	id: string;
	parentPath: string[];
	immediateGameCount: number;
	immediateValidGameCount: number;
	immediateMissingGameCount: number;
	totalGameCount: number;
	totalValidGameCount: number;
	totalMissingGameCount: number;
	entries: PlanGameDirectory;
	isDirty?: boolean;
	hasAnInvalidDescendant?: boolean;
};
