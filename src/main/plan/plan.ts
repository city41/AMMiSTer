import fsp from 'node:fs/promises';
import { Plan } from './types';

function newPlan(): Plan {
	const now = Date.now();
	return {
		name: '',
		createdAt: now,
		updatedAt: now,
		games: [],
	};
}

async function savePlan(plan: Plan, filePath: string): Promise<void> {
	plan.updatedAt = Date.now();
	const planJson = JSON.stringify(plan, null, 2);
	return fsp.writeFile(filePath, planJson);
}

export { newPlan, savePlan };
