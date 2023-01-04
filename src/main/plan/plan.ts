import path from 'node:path';
import fsp from 'node:fs/promises';
import Debug from 'debug';
import { isCatalogEntry } from '../catalog';
import { Plan, PlanGameDirectoryEntry } from './types';

const debug = Debug('main/plan/plan.ts');

function isPlanGameDirectoryEntry(obj: unknown): obj is PlanGameDirectoryEntry {
	if (!obj) {
		debug('isPlanGameDirectoryEntry: obj is falsy');
		return false;
	}

	const p = obj as PlanGameDirectoryEntry;

	if (typeof p.directoryName !== 'string') {
		debug('isPlanGameDirectoryEntry: p.directoryName !== string');
		return false;
	}

	if (!Array.isArray(p.games)) {
		debug('isPlanGameDirectoryEntry: p.games is not a directory');
		return false;
	}

	return true;
}

function isPlan(obj: unknown): obj is Plan {
	if (!obj) {
		debug('isPlan: obj is falsy');
		return false;
	}

	const plan = obj as Plan;

	if (typeof plan.directoryName !== 'string') {
		debug('isPlan: plan.name !== string');
		return false;
	}

	if (typeof plan.createdAt !== 'number') {
		debug('isPlan: plan.createdAt !== number');
		return false;
	}

	if (typeof plan.updatedAt !== 'number') {
		debug('isPlan: plan.updatedAt !== number');
		return false;
	}

	if (!Array.isArray(plan.games)) {
		debug('isPlan: plan.games is not an array');
		return false;
	}

	if (
		plan.games.length > 0 &&
		!isCatalogEntry(plan.games[0]) &&
		!isPlanGameDirectoryEntry(plan.games[0])
	) {
		debug('isPlan: first entry is not expected');
		return false;
	}

	return true;
}

function newPlan(): Plan {
	const now = Date.now();
	return {
		directoryName: '',
		isExpanded: true,
		createdAt: now,
		updatedAt: now,
		games: [],
	};
}

async function savePlan(plan: Plan, filePath: string): Promise<void> {
	if (path.extname(filePath) !== '.amip') {
		filePath += '.amip';
	}

	plan.updatedAt = Date.now();
	const planJson = JSON.stringify(plan, null, 2);
	return fsp.writeFile(filePath, planJson);
}

async function openPlan(path: string): Promise<Plan | null> {
	debug(`openPlan(${path})`);

	try {
		const contents = await (await fsp.readFile(path)).toString();
		const plan = JSON.parse(contents);
		if (!isPlan(plan)) {
			debug('openPlan: isPlan returned false');
			return null;
		} else {
			return plan;
		}
	} catch (e) {
		debug(`openPlan: unexpected error ${e}`);
		return null;
	}
}

export { newPlan, savePlan, openPlan };
