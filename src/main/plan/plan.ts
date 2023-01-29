import path from 'node:path';
import fsp from 'node:fs/promises';
import Debug from 'debug';
import { getCurrentCatalog } from '../catalog';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
	PlanMissingEntry,
	SerializedGameEntry,
	SerializedPlan,
	SerializedPlanGameDirectory,
	SerializedPlanGameDirectoryEntry,
} from './types';
import { Catalog, CatalogEntry } from '../catalog/types';
import { isCatalogEntry } from '../catalog/util';
import { UpdateDbConfig } from '../settings/types';
import { getSetting } from '../settings';

const debug = Debug('main/plan/plan.ts');

function isMissingEntry(obj: unknown): obj is PlanMissingEntry {
	if (!obj) {
		return false;
	}

	if (typeof obj !== 'object') {
		return false;
	}

	return 'missing' in obj && obj.missing === true;
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
		!isCatalogEntry(plan.games[0]) &&
		!isPlanGameDirectoryEntry(plan.games[0]) &&
		!isMissingEntry(plan.games[0])
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

function serializeDirectory(
	games: PlanGameDirectory
): SerializedPlanGameDirectory {
	return games.map((g) => {
		if ('gameName' in g) {
			return {
				db_id: g.files.mra.db_id,
				relFilePath: g.files.mra.relFilePath,
			};
		} else if ('games' in g) {
			return {
				...g,
				games: serializeDirectory(g.games),
			};
		} else {
			// missing entry
			return g;
		}
	});
}

function serialize(plan: Plan): SerializedPlan {
	return {
		...plan,
		games: serializeDirectory(plan.games),
	};
}

function deserializeDirectory(
	games: SerializedPlanGameDirectory | PlanGameDirectory,
	catalog: Catalog,
	updateDbs: UpdateDbConfig[]
): PlanGameDirectory {
	// @ts-expect-error TS can't figure out they overlap here
	return games.reduce<PlanGameDirectory>(
		(
			accum: PlanGameDirectory,
			g:
				| SerializedGameEntry
				| CatalogEntry
				| SerializedPlanGameDirectoryEntry
				| PlanGameDirectoryEntry
		) => {
			if ('games' in g) {
				return accum.concat({
					...g,
					games: deserializeDirectory(g.games, catalog, updateDbs),
				});
			} else {
				const relFilePath =
					'gameName' in g ? g.files.mra.relFilePath : g.relFilePath;

				const updateDbConfig = updateDbs.find((u) => u.db_id === g.db_id);

				if (!updateDbConfig?.enabled) {
					return accum.concat({
						db_id: g.db_id,
						relFilePath: relFilePath,
						missing: true,
					});
				}

				const entries = catalog[g.db_id];
				const entry = entries?.find((e) => {
					return e.files.mra.relFilePath === relFilePath;
				});

				if (entry) {
					return accum.concat(entry);
				} else {
					return accum.concat({
						db_id: g.db_id,
						relFilePath: relFilePath,
						missing: true,
					});
				}
			}
		},
		[]
	);
}

function deserialize(
	plan: SerializedPlan | Plan,
	catalog: Catalog,
	updateDbs: UpdateDbConfig[]
): Plan {
	return {
		...plan,
		games: deserializeDirectory(plan.games, catalog, updateDbs),
	};
}

async function savePlan(plan: Plan, filePath: string): Promise<string> {
	if (path.extname(filePath) !== '.amip') {
		filePath += '.amip';
	}

	plan.updatedAt = Date.now();
	const serializedPlan = serialize(plan);

	const serializedPlanAsJson = JSON.stringify(serializedPlan, null, 2);
	await fsp.writeFile(filePath, serializedPlanAsJson);

	return filePath;
}

function isInvalidEntry(entry: CatalogEntry): boolean {
	return (
		entry.files.mra.status !== 'ok' ||
		entry.files.rbf?.status !== 'ok' ||
		entry.files.roms.some((r) => r.status !== 'ok')
	);
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
			const invalid = await isInvalidEntry(entry);

			hasAnInvalidDescendant = hasAnInvalidDescendant || invalid;
		} else if ('games' in entry) {
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
		const serializedPlan = JSON.parse(contents);

		if (!isPlan(serializedPlan)) {
			debug('openPlan: isPlan returned false for serializedPlan');
			return null;
		}

		const currentCatalog =
			(await getCurrentCatalog()) ??
			({
				updatedAt: Date.now(),
			} as Catalog);

		const updateDbConfigs = await getSetting<UpdateDbConfig[]>('updateDbs');

		const plan = deserialize(serializedPlan, currentCatalog, updateDbConfigs);

		if (!isPlan(plan)) {
			debug('openPlan: isPlan returned false');
			return null;
		} else {
			const auditedPlan = (await audit(plan)) as Plan;
			debug('auditedPlan', JSON.stringify(auditedPlan, null, 2));
			return auditedPlan;
		}
	} catch (e) {
		debug('openPlan: unexpected error', e);
		return null;
	}
}

export { newPlan, savePlan, openPlan };
