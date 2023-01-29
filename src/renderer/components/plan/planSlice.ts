import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import undoable, {
	ActionCreators,
	StateWithHistory,
	excludeAction,
} from 'redux-undo';
import { Catalog, CatalogEntry } from 'src/main/catalog/types';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
	PlanMissingEntry,
} from '../../../main/plan/types';
import { AppState } from '../../store';
import { BatchGroupBy } from './BatchGroupBy';

const batchGroupBy = new BatchGroupBy();

type RotationBulkAddCriteria = {
	gameAspect: 'rotation';
	operator: 'is' | 'is-not';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type StringArrayBulkAddCriteria = {
	gameAspect:
		| 'manufacturer'
		| 'categories'
		| 'move_inputs'
		| 'series'
		| 'platform'
		| 'special_controls';
	operator: 'is' | 'is-not';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type StringBulkAddCriteria = {
	gameAspect: 'gameName' | 'region';
	operator: 'is' | 'is-not';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type NumberBulkAddCriteria = {
	gameAspect: 'yearReleased' | 'num_buttons';
	operator: 'is' | 'is-not' | 'gte' | 'lte';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type BulkAddCriteria =
	| RotationBulkAddCriteria
	| StringArrayBulkAddCriteria
	| StringBulkAddCriteria
	| NumberBulkAddCriteria;

type InternalPlanState = {
	// undefined and null are crucially different
	// undefined -> unknown if there is a plan or not, main has not told us
	// null -> main told us there is no plan
	plan: Plan | null | undefined;
	isDirty: boolean;
	criteriaMatch: CatalogEntry[] | null;
	missingDetailEntry: PlanMissingEntry | null;
};

type PlanState = StateWithHistory<InternalPlanState>;

const initialState: InternalPlanState = {
	plan: undefined,
	isDirty: false,
	criteriaMatch: null,
	missingDetailEntry: null,
};

function getAllGamesInPlan(planDir: PlanGameDirectory): CatalogEntry[] {
	const games: CatalogEntry[] = [];

	for (const entry of planDir) {
		if ('games' in entry) {
			const subGames = getAllGamesInPlan(entry.games);
			games.push(...subGames);
		} else if ('gameName' in entry) {
			games.push(entry);
		}
		// the other type, PlanMissingEntry, is ignored on purpose
	}

	return games;
}

function getNode(plan: Plan, path: string[]): PlanGameDirectoryEntry {
	let dir: PlanGameDirectory = [plan];
	let foundDirEntry: PlanGameDirectoryEntry | undefined = undefined;

	for (const segment of path) {
		const dirEntry = dir.find((e) => {
			return (
				'directoryName' in e &&
				e.directoryName.toLowerCase() === segment.toLowerCase()
			);
		});

		if (!dirEntry) {
			throw new Error(
				`planSlice, getNode: failed to find a directory while traversing: ${path.join(
					'/'
				)}`
			);
		}

		if ('gameName' in dirEntry || 'relFilePath' in dirEntry) {
			throw new Error(
				`planSlice, getNode: get a game (or missing game) instead of a directory while traversing: ${path.join(
					'/'
				)}`
			);
		}

		foundDirEntry = dirEntry;
		dir = dirEntry.games;
	}

	if (!foundDirEntry) {
		throw new Error(
			`planSlice, getNode: failed to find a directory after traversing entire path: ${path.join(
				'/'
			)}`
		);
	}

	return foundDirEntry;
}

function createDirectoriesIfNeeded(plan: Plan, planPath: string[]): void {
	let dir = plan.games;

	for (const segment of planPath) {
		const subDir = dir.find((g) => {
			return (
				'directoryName' in g &&
				g.directoryName.toLowerCase() === segment.toLowerCase()
			);
		});

		if (!subDir) {
			const l = dir.push({
				directoryName: segment,
				games: [],
				isExpanded: true,
			});
			dir = (dir[l - 1] as PlanGameDirectoryEntry).games;
		} else {
			dir = (subDir as PlanGameDirectoryEntry).games;
		}
	}
}

function getEntryName(
	entry: PlanGameDirectoryEntry | CatalogEntry | PlanMissingEntry
): string {
	if ('games' in entry) {
		return entry.directoryName;
	}

	if ('gameName' in entry) {
		return entry.gameName;
	}

	return entry.relFilePath;
}

const planSlice = createSlice({
	name: 'plan',
	initialState,
	reducers: {
		clearDirty(state: InternalPlanState) {
			state.isDirty = false;
		},
		setPlan(state: InternalPlanState, action: PayloadAction<Plan | null>) {
			state.plan = action.payload;
			state.isDirty = false;
		},
		addCatalogEntry(
			state: InternalPlanState,
			action: PayloadAction<{
				parentPath: string[];
				catalogEntry: CatalogEntry;
			}>
		) {
			if (state.plan) {
				const { parentPath, catalogEntry } = action.payload;

				createDirectoriesIfNeeded(state.plan, parentPath.slice(1));

				const parent = getNode(state.plan, parentPath);

				const alreadyInParent = parent.games.some(
					(g) =>
						'gameName' in g &&
						g.files.mra.fileName === catalogEntry.files.mra.fileName
				);

				if (!alreadyInParent) {
					parent.games.push(catalogEntry);
					state.isDirty = true;
				}
			}
		},
		moveItem(
			state: InternalPlanState,
			action: PayloadAction<{
				prevParentPath: string[];
				newParentPath: string[];
				name: string;
			}>
		) {
			if (state.plan) {
				const { prevParentPath, newParentPath, name } = action.payload;

				const prevParent = getNode(state.plan, prevParentPath);
				const newParent = getNode(state.plan, newParentPath);

				if (
					'directoryName' in newParent &&
					newParent.directoryName.toLowerCase() === 'favorites'
				) {
					// for now at least, dont allow directories in favorites
					return;
				}

				const prevIndex = prevParent.games.findIndex((g) => {
					if ('directoryName' in g) {
						return g.directoryName === name;
					} else if ('gameName' in g) {
						return g.gameName === name;
					} else {
						// TODO: should probably disallow moving missing games
						return g.relFilePath === name;
					}
				});

				const entry = prevParent.games[prevIndex];
				const movingNodeName = getEntryName(entry);

				if ('gameName' in entry) {
					const alreadyInParent = newParent.games.some(
						(g) =>
							'gameName' in g &&
							g.files.mra.fileName === entry.files.mra.fileName
					);

					if (!alreadyInParent) {
						const [movingNode] = prevParent.games.splice(prevIndex, 1);
						const destIndex = newParent.games.findIndex((g) => {
							const name = getEntryName(g);
							return movingNodeName.localeCompare(name) <= 0;
						});
						newParent.games.splice(destIndex, 0, movingNode);
						state.isDirty = true;
					}
				} else if ('games' in entry) {
					const dirInNewParentWithSameName = newParent.games.find(
						(g) =>
							'directoryName' in g &&
							g.directoryName.toLowerCase() ===
								getEntryName(entry).toLowerCase()
					) as PlanGameDirectoryEntry;

					if (dirInNewParentWithSameName) {
						entry.games.forEach((movingNode) => {
							const movingNodeName = getEntryName(movingNode);

							const destIndex = dirInNewParentWithSameName.games.findIndex(
								(g) => {
									const name = getEntryName(g);
									return movingNodeName.localeCompare(name) <= 0;
								}
							);
							dirInNewParentWithSameName.games.splice(destIndex, 0, movingNode);
						});
					} else {
						const destIndex = newParent.games.findIndex((g) => {
							const name = getEntryName(g);
							return movingNodeName.localeCompare(name) <= 0;
						});
						newParent.games.splice(destIndex, 0, entry);
					}

					prevParent.games.splice(prevIndex, 1);
					state.isDirty = true;
				}
			}
		},
		deleteItem(
			state: InternalPlanState,
			action: PayloadAction<{ parentPath: string[]; name: string }>
		) {
			if (state.plan) {
				const { parentPath, name } = action.payload;
				const parent = getNode(state.plan, parentPath);

				const initialCount = parent.games.length;

				parent.games = parent.games.filter((g) => {
					return getEntryName(g) !== name;
				});

				state.isDirty = initialCount > parent.games.length;
			}
		},
		deleteAllMissingGamesInDirectory(
			state: InternalPlanState,
			action: PayloadAction<{ parentPath: string[] }>
		) {
			if (state.plan) {
				const { parentPath } = action.payload;
				const parent = getNode(state.plan, parentPath);

				const gameCount = parent.games.length;
				parent.games = parent.games.filter((g) => {
					return !('missing' in g) || !g.missing;
				});

				state.isDirty = gameCount !== parent.games.length;
			}
		},
		addDirectory(
			state: InternalPlanState,
			action: PayloadAction<{ parentPath: string[] }>
		) {
			if (state.plan) {
				const { parentPath } = action.payload;
				const parent = getNode(state.plan, parentPath);

				if (
					'directoryName' in parent &&
					parent.directoryName.toLowerCase() === 'favorites'
				) {
					// for now at least, dont allow directories in favorites
					return;
				}

				let newDirSuffix = 0;
				let newDirectoryName = 'New Directory';

				while (
					parent.games.some((g) => {
						const entryName = getEntryName(g);
						return `${newDirectoryName}${newDirSuffix || ''}` === entryName;
					})
				) {
					newDirSuffix += 1;
				}

				newDirectoryName += (newDirSuffix || '').toString();

				const newDirectoryNode: PlanGameDirectoryEntry = {
					directoryName: newDirectoryName,
					games: [],
					isExpanded: true,
				};

				const destIndex = parent.games.findIndex((g) => {
					const entryName = getEntryName(g);
					return newDirectoryName.localeCompare(entryName) <= 0;
				});
				parent.games.splice(destIndex, 0, newDirectoryNode);
				parent.isExpanded = true;
				state.isDirty = true;
			}
		},
		planRename(state: InternalPlanState, action: PayloadAction<string>) {
			if (state.plan) {
				const oldName = state.plan.directoryName;
				const newName = action.payload;

				state.plan.directoryName = newName;

				state.isDirty = oldName !== newName;
			}
		},
		directoryRename(
			state: InternalPlanState,
			action: PayloadAction<{
				parentPath: string[];
				name: string;
				newName: string;
			}>
		) {
			if (state.plan) {
				const { parentPath, name, newName } = action.payload;

				// dont allow empty directory names
				if (!newName || !newName.trim()) {
					return;
				}

				const parent = getNode(state.plan, parentPath);

				const entry = parent.games.find((g) => {
					return 'directoryName' in g && g.directoryName === name;
				}) as PlanGameDirectoryEntry;

				if (entry) {
					const oldName = entry.directoryName;

					entry.directoryName = newName;
					state.isDirty = oldName !== newName;
				}
			}
		},
		toggleDirectoryExpansion(
			state: InternalPlanState,
			action: PayloadAction<{ path: string[] }>
		) {
			if (state.plan) {
				const { path } = action.payload;
				const node = getNode(state.plan, path);
				node.isExpanded = !node.isExpanded;
			}
		},
		toggleFavorite(
			state: InternalPlanState,
			action: PayloadAction<CatalogEntry>
		) {
			if (state.plan) {
				const catalogEntry = action.payload;

				createDirectoriesIfNeeded(state.plan, ['favorites']);

				const favDir = state.plan.games.find((e) => {
					return (
						'directoryName' in e &&
						e.directoryName.toLowerCase() === 'favorites'
					);
				}) as PlanGameDirectoryEntry;

				const currentIndex = favDir.games.findIndex((g) => {
					return (
						'gameName' in g &&
						g.files.mra.fileName === catalogEntry.files.mra.fileName
					);
				});

				if (currentIndex > -1) {
					favDir.games.splice(currentIndex, 1);
				} else {
					const newGameName = catalogEntry.gameName;

					const destIndex = favDir.games.findIndex((g) => {
						const entryName = getEntryName(g);
						return newGameName.localeCompare(entryName) <= 0;
					});
					favDir.games.splice(destIndex, 0, catalogEntry);
					favDir.isExpanded = true;
				}

				state.isDirty = true;
			}
		},
		setCriteriaMatch(
			state: InternalPlanState,
			action: PayloadAction<CatalogEntry[]>
		) {
			state.criteriaMatch = action.payload;
		},
		resetCriteriaMatch(state: InternalPlanState) {
			state.criteriaMatch = null;
		},
		setMissingDetailEntry(
			state: InternalPlanState,
			action: PayloadAction<PlanMissingEntry>
		) {
			state.missingDetailEntry = action.payload;
		},
		clearMissingDetailEntry(state: InternalPlanState) {
			state.missingDetailEntry = null;
		},
	},
});

type PlanSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const addItem =
	({
		parentPath,
		db_id,
		mraFileName,
	}: {
		parentPath: string[];
		db_id: string;
		mraFileName: string;
	}): PlanSliceThunk =>
	(dispatch, getState) => {
		const plan = getState().plan.present.plan;
		const catalog = getState().catalog.catalog;

		if (plan && catalog) {
			const { updatedAt, ...restOfCatalog } = catalog;
			const db = restOfCatalog[db_id];
			const catalogEntry = db.find((e) => {
				return e.files.mra.fileName === mraFileName;
			});

			if (!catalogEntry) {
				throw new Error(
					`planSlice#addItem: failed to find a CatalogEntry for ${db_id}/${mraFileName}`
				);
			}

			dispatch(planSlice.actions.addCatalogEntry({ parentPath, catalogEntry }));
		}
	};

const loadNewPlan = (): PlanSliceThunk => async (dispatch, getState) => {
	const { plan: currentPlan, isDirty } = getState().plan.present;

	if (currentPlan && isDirty) {
		const proceed = confirm(
			`${currentPlan.directoryName} has unsaved changes, proceed?`
		);

		if (!proceed) {
			return;
		}
	}

	const plan = await window.ipcAPI.newPlan();
	plan.directoryName = 'New Plan';
	dispatch(planSlice.actions.setPlan(plan));
	dispatch(ActionCreators.clearHistory());
};

const loadOpenedPlan =
	(plan: Plan | null): PlanSliceThunk =>
	(dispatch, getState) => {
		const { plan: currentPlan, isDirty } = getState().plan.present;

		if (currentPlan && isDirty) {
			const proceed = confirm(
				`${currentPlan.directoryName} has unsaved changes, proceed?`
			);

			if (!proceed) {
				return;
			}
		}

		dispatch(planSlice.actions.setPlan(plan));
		dispatch(ActionCreators.clearHistory());
	};

const loadDemoPlan = (): PlanSliceThunk => async (dispatch, getState) => {
	const catalog = getState().catalog.catalog;

	if (catalog) {
		const plan = await window.ipcAPI.newPlan();

		const { updatedAt, ...restOfCatalog } = catalog;
		const allCatalogEntries = Object.values(restOfCatalog).flat(1);

		const horizontalCapcomEntries = allCatalogEntries.filter(
			(ce) => ce.manufacturer.includes('Capcom') && ce.rotation === 0
		);

		const horizontalSegaEntries = allCatalogEntries.filter(
			(ce) => ce.manufacturer.includes('Sega') && ce.rotation === 0
		);

		const capcomFighters = horizontalCapcomEntries.filter((ce) =>
			ce.categories.some((c) => c.includes('Fight'))
		);
		const capcomShooters = horizontalCapcomEntries.filter((ce) =>
			ce.categories.some((c) => c.includes('Shoot'))
		);
		const segaShooters = horizontalSegaEntries.filter((ce) =>
			ce.categories.some((c) => c.includes('Shoot'))
		);

		plan.directoryName = 'Demo Plan';
		plan.games = [
			{
				directoryName: 'Capcom',
				isExpanded: true,
				games: [
					{
						directoryName: 'Fighters',
						isExpanded: false,
						games: capcomFighters,
					},
					{
						directoryName: 'Horizontal Shooters',
						isExpanded: true,
						games: capcomShooters,
					},
				],
			},
			{
				directoryName: 'Sega',
				isExpanded: true,
				games: [
					{
						directoryName: 'Horizontal Shooters',
						isExpanded: true,
						games: segaShooters,
					},
				],
			},
		];

		dispatch(planSlice.actions.setPlan(plan));
	}
};

const savePlanAs = (): PlanSliceThunk => async (dispatch, getState) => {
	const plan = getState().plan.present.plan;

	if (plan) {
		const wasSaved = await window.ipcAPI.savePlanAs(plan);

		if (wasSaved) {
			dispatch(planSlice.actions.clearDirty());
		}
	}
};

const savePlan = (): PlanSliceThunk => async (dispatch, getState) => {
	const plan = getState().plan.present.plan;

	if (plan) {
		const wasSaved = await window.ipcAPI.savePlan(plan);

		if (wasSaved) {
			dispatch(planSlice.actions.clearDirty());
		}
	}
};

function matchesCriteria(
	entry: CatalogEntry,
	criteria: BulkAddCriteria
): boolean {
	const entryValue = entry[criteria.gameAspect as keyof CatalogEntry];

	if (entryValue === null || entryValue === undefined) {
		return !criteria.value;
	}

	if (Array.isArray(entryValue) && entryValue.length === 0) {
		return !criteria.value;
	}

	switch (criteria.gameAspect) {
		case 'manufacturer':
		case 'series':
		case 'move_inputs':
		case 'special_controls':
		case 'platform':
		case 'categories': {
			if (criteria.operator === 'is') {
				return (entryValue as string[]).some((ev) => ev === criteria.value);
			} else {
				return !(entryValue as string[]).some((ev) => ev === criteria.value);
			}
		}
		case 'rotation': {
			if (criteria.operator === 'is') {
				if (criteria.value === 'horizontal') {
					return entryValue === 0;
				} else {
					return entryValue === 90 || entryValue === 270;
				}
			} else {
				if (criteria.value === 'horizontal') {
					return entryValue === 90 || entryValue === 270;
				} else {
					return entryValue === 0;
				}
			}
		}
		case 'yearReleased':
		case 'num_buttons': {
			const numericValue = entryValue as number;
			const criteriaValue = parseInt(criteria.value, 10);
			switch (criteria.operator) {
				case 'gte': {
					return numericValue >= criteriaValue;
				}
				case 'lte': {
					return numericValue <= criteriaValue;
				}
				case 'is': {
					return numericValue === criteriaValue;
				}
				case 'is-not': {
					return numericValue !== criteriaValue;
				}
				default: {
					return false;
				}
			}
		}
		case 'region':
		case 'gameName': {
			const valS = entryValue as string;
			switch (criteria.operator) {
				case 'is': {
					return valS === criteria.value;
				}
				case 'is-not': {
					return valS !== criteria.value;
				}
			}
		}
	}
}

function getEntriesBasedOnCriteria(
	catalog: Catalog,
	criterias: BulkAddCriteria[]
): CatalogEntry[] {
	const { updatedAt, ...restOfCatalog } = catalog;

	const allEntries = Object.values(restOfCatalog).flat(1);

	let contenders = allEntries;

	for (const criteria of criterias) {
		contenders = contenders.filter((c) => matchesCriteria(c, criteria));
	}

	return contenders;
}

function bulkAdd({
	criteria,
	destination,
	addOnlyNew,
}: {
	criteria: BulkAddCriteria[];
	destination: string;
	addOnlyNew: boolean;
}): PlanSliceThunk {
	return (dispatch, getState) => {
		const catalog = getState().catalog.catalog;
		const plan = getState().plan.present.plan;

		if (catalog && plan && criteria.length > 0) {
			const entriesToAdd = getEntriesBasedOnCriteria(catalog, criteria);
			const path = destination
				.trim()
				.split('/')
				.map((seg) => seg.trim())
				.filter((seg) => !!seg);

			// if addOnlyNew is not set, we'll pretend the plan is empty to
			// just send all games through
			const allGamesInPlan = addOnlyNew ? getAllGamesInPlan(plan.games) : [];

			batchGroupBy.start();
			entriesToAdd.forEach((entry) => {
				if (
					allGamesInPlan.every(
						(g) => g.files.mra.fileName !== entry.files.mra.fileName
					)
				) {
					dispatch(
						planSlice.actions.addCatalogEntry({
							parentPath: [plan.directoryName].concat(path),
							catalogEntry: entry,
						})
					);
				}
			});

			dispatch(planSlice.actions.resetCriteriaMatch());

			batchGroupBy.end();
		}
	};
}

function buildCriteriaMatch(criteria: BulkAddCriteria[]): PlanSliceThunk {
	return (dispatch, getState) => {
		const catalog = getState().catalog.catalog;
		const plan = getState().plan.present.plan;

		if (catalog && plan) {
			if (criteria.length > 0) {
				const criteriaMatch = getEntriesBasedOnCriteria(catalog, criteria);
				dispatch(planSlice.actions.setCriteriaMatch(criteriaMatch));
			} else {
				dispatch(planSlice.actions.resetCriteriaMatch());
			}
		}
	};
}

const reducer = planSlice.reducer;
const {
	setPlan,
	moveItem,
	deleteItem,
	deleteAllMissingGamesInDirectory,
	addDirectory,
	planRename,
	directoryRename,
	toggleDirectoryExpansion,
	toggleFavorite,
	resetCriteriaMatch,
	setMissingDetailEntry,
	clearMissingDetailEntry,
} = planSlice.actions;

const undoableReducer = undoable(reducer, {
	filter: excludeAction([
		'plan/loadNewPlan',
		'plan/loadDemoPlan',
		'plan/savePlan',
		'plan/savePlanAs',
		'plan/buildCriteriaMatch',
		planSlice.actions.setCriteriaMatch.toString(),
		planSlice.actions.resetCriteriaMatch.toString(),
		planSlice.actions.clearDirty.toString(),
	]),
	groupBy: batchGroupBy.init(),
});
const { undo, redo } = ActionCreators;

export {
	undoableReducer as reducer,
	loadOpenedPlan,
	loadNewPlan,
	loadDemoPlan,
	setPlan,
	savePlan,
	savePlanAs,
	addItem,
	deleteItem,
	deleteAllMissingGamesInDirectory,
	moveItem,
	addDirectory,
	planRename,
	directoryRename,
	toggleDirectoryExpansion,
	toggleFavorite,
	bulkAdd,
	buildCriteriaMatch,
	resetCriteriaMatch,
	setMissingDetailEntry,
	clearMissingDetailEntry,
	undo,
	redo,
	getAllGamesInPlan,
};
export type { PlanState, BulkAddCriteria };
