import path from '../util/universalPath';
import fsp from 'node:fs/promises';
import Debug from 'debug';
import {
	LegacyPlan,
	LegacyPlanGameDirectory,
	LegacyPlanGameDirectoryEntry,
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
	PlanGameEntry,
} from './types';
import { CatalogEntry } from '../catalog/types';

const debug = Debug('main/plan/plan.ts');

function isPlanGameEntry(obj: unknown): obj is PlanGameEntry {
	if (!obj) {
		return false;
	}

	if (typeof obj !== 'object') {
		return false;
	}

	const p = obj as PlanGameEntry;

	if (typeof p.db_id !== 'string') {
		return false;
	}

	if (typeof p.relFilePath !== 'string') {
		return false;
	}

	return true;
}

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
		!isPlanGameEntry(plan.games[0]) &&
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

/**
 * See explanation below at convertLegacyPlan
 */
function convertLegacyDirectory(
	games: LegacyPlanGameDirectory | PlanGameDirectory
): PlanGameDirectory {
	// @ts-expect-error TS can't figure out they overlap here
	return games.reduce<PlanGameDirectory>(
		(
			accum: PlanGameDirectory,
			g:
				| PlanGameEntry
				| CatalogEntry
				| LegacyPlanGameDirectoryEntry
				| PlanGameDirectoryEntry
		) => {
			if ('games' in g) {
				return accum.concat({
					...g,
					games: convertLegacyDirectory(g.games),
				});
			} else {
				if ('relFilePath' in g) {
					return accum.concat(g);
				} else {
					return accum.concat({
						db_id: g.db_id,
						relFilePath: g.files.mra.relFilePath,
					});
				}
			}
		},
		[]
	);
}

/**
 * Plans used to just store CatalogEntrys in them. This was a bad idea,
 * as updates could change the name of MRA files, causing orphans. Plan entries
 * are now just a db_id and mra file path, and use the current catalog to get
 * the rest of the info.
 *
 * This function converts the old style plan to new style
 */
function convertLegacyPlan(plan: LegacyPlan | Plan): Plan {
	return {
		...plan,
		games: convertLegacyDirectory(plan.games),
	};
}

/**
 * Saves the given plan to the given file path. Returns the final saved
 * path. The only difference from input to output path can be adding .amip extension
 */
async function savePlan(plan: Plan, filePath: string): Promise<string> {
	if (path.extname(filePath) !== '.amip') {
		filePath += '.amip';
	}

	plan.updatedAt = Date.now();
	const planAsJson = JSON.stringify(plan, null, 2);
	await fsp.writeFile(filePath, planAsJson);

	return filePath;
}

/**
 * Opens a plan at the given path, and verifies the file contains a plan.
 * If it does not, or can't be found, null is returned.
 */
async function openPlan(path: string): Promise<Plan | null> {
	debug(`openPlan(${path})`);

	try {
		const contents = (await fsp.readFile(path)).toString();
		const plan = JSON.parse(contents);
		const finalPlan = convertLegacyPlan(plan);

		if (!isPlan(finalPlan)) {
			debug('openPlan: isPlan returned false');
			return null;
		}

		return finalPlan;
	} catch (e) {
		debug('openPlan: unexpected error', e);
		return null;
	}
}

export { newPlan, savePlan, openPlan, isPlanGameEntry };
