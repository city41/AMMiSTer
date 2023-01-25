import path from 'node:path';
import fsp from 'node:fs/promises';
import Debug from 'debug';
import { auditCatalogEntry, isCatalogEntry } from '../catalog';
import { Plan, PlanGameDirectoryEntry } from './types';
import { CatalogEntry } from '../catalog/types';
import { getGameCacheDir } from '../util/fs';

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

async function savePlan(plan: Plan, filePath: string): Promise<string> {
	if (path.extname(filePath) !== '.amip') {
		filePath += '.amip';
	}

	plan.updatedAt = Date.now();
	const planJson = JSON.stringify(plan, null, 2);
	await fsp.writeFile(filePath, planJson);

	return filePath;
}

/**
 * For all files in the plan, confirms they are found in the gameCache. If not,
 * markes the CatalogEntry's status as 'unexpected-missing' and the path from
 * root to that entry has hasAnInvalidDescendant=true
 */
async function audit(
	planDirEntry: PlanGameDirectoryEntry
): Promise<PlanGameDirectoryEntry> {
	let hasAnInvalidDescendant = false;

	for (const entry of planDirEntry.games) {
		if ('gameName' in entry) {
			const invalid = await auditCatalogEntry(entry);

			hasAnInvalidDescendant = hasAnInvalidDescendant || invalid;
		} else {
			await audit(entry);
			hasAnInvalidDescendant =
				hasAnInvalidDescendant || !!entry.hasAnInvalidDescendant;
		}
	}

	planDirEntry.hasAnInvalidDescendant = hasAnInvalidDescendant;
	return planDirEntry;
}

async function openPlan(path: string): Promise<Plan | null> {
	debug(`openPlan(${path})`);

	try {
		const contents = (await fsp.readFile(path)).toString();
		const plan = JSON.parse(contents);
		if (!isPlan(plan)) {
			debug('openPlan: isPlan returned false');
			return null;
		} else {
			const auditedPlan = (await audit(plan)) as Plan;
			debug('auditedPlan', JSON.stringify(auditedPlan, null, 2));
			return auditedPlan;
		}
	} catch (e) {
		debug(`openPlan: unexpected error ${e}`);
		return null;
	}
}

export { newPlan, savePlan, openPlan };
