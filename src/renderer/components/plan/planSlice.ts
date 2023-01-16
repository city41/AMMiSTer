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
} from '../../../main/plan/types';
import { AppState } from '../../store';
import { BatchGroupBy } from './BatchGroupBy';

const batchGroupBy = new BatchGroupBy();

type EnumBulkAddCriteria = {
	gameAspect: 'orientation';
	operator: 'is' | 'is-not';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type StringArrayBulkAddCriteria = {
	gameAspect: 'manufacturer' | 'categories';
	operator: 'is' | 'is-not';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type StringBulkAddCriteria = {
	gameAspect: 'gameName' | 'core';
	operator: 'is' | 'is-not';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type NumberBulkAddCriteria = {
	gameAspect: 'yearReleased';
	operator: 'is' | 'is-not' | 'gte' | 'lte';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type BulkAddCriteria =
	| EnumBulkAddCriteria
	| StringArrayBulkAddCriteria
	| StringBulkAddCriteria
	| NumberBulkAddCriteria;

type InternalPlanState = {
	// undefined and null are crucially different
	// undefined -> unknown if there is a plan or not, main has not told us
	// null -> main told us there is no plan
	plan: Plan | null | undefined;
	isDirty: boolean;
};

type PlanState = StateWithHistory<InternalPlanState>;

const initialState: InternalPlanState = {
	plan: undefined,
	isDirty: false,
};

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

		if ('gameName' in dirEntry) {
			throw new Error(
				`planSlice, getNode: get a game instead of a directory while traversing: ${path.join(
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

const planSlice = createSlice({
	name: 'plan',
	initialState,
	reducers: {
		clearDirty(state: InternalPlanState) {
			state.isDirty = false;
		},
		setPlan(state: InternalPlanState, action: PayloadAction<Plan>) {
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
					parent.games = parent.games.slice().sort();
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
					} else {
						return g.gameName === name;
					}
				});

				const entry = prevParent.games[prevIndex];
				const movingNodeName =
					'gameName' in entry ? entry.gameName : entry.directoryName;

				if ('gameName' in entry) {
					const alreadyInParent = newParent.games.some(
						(g) =>
							'gameName' in g &&
							g.files.mra.fileName === entry.files.mra.fileName
					);

					if (!alreadyInParent) {
						const [movingNode] = prevParent.games.splice(prevIndex, 1);
						const destIndex = newParent.games.findIndex((g) => {
							const name = 'gameName' in g ? g.gameName : g.directoryName;
							return movingNodeName.localeCompare(name) <= 0;
						});
						newParent.games.splice(destIndex, 0, movingNode);
						state.isDirty = true;
					}
				} else {
					const dirInNewParentWithSameName = newParent.games.find(
						(g) =>
							'directoryName' in g &&
							g.directoryName.toLowerCase() ===
								entry.directoryName.toLowerCase()
					) as PlanGameDirectoryEntry;

					if (dirInNewParentWithSameName) {
						entry.games.forEach((movingNode) => {
							const movingNodeName =
								'gameName' in movingNode
									? movingNode.gameName
									: movingNode.directoryName;

							const destIndex = dirInNewParentWithSameName.games.findIndex(
								(g) => {
									const name = 'gameName' in g ? g.gameName : g.directoryName;
									return movingNodeName.localeCompare(name) <= 0;
								}
							);
							dirInNewParentWithSameName.games.splice(destIndex, 0, movingNode);
						});
					} else {
						const destIndex = newParent.games.findIndex((g) => {
							const name = 'gameName' in g ? g.gameName : g.directoryName;
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

				let initialCount = parent.games.length;

				parent.games = parent.games.filter((g) => {
					if ('directoryName' in g) {
						return g.directoryName !== name;
					} else {
						return g.gameName !== name;
					}
				});

				state.isDirty = initialCount > parent.games.length;
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
						const entryName = 'gameName' in g ? g.gameName : g.directoryName;
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
					const entryName = 'gameName' in g ? g.gameName : g.directoryName;
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
				const { parentPath, name } = action.payload;
				let { newName } = action.payload;

				// dont allow empty directory names
				if (!newName || !newName.trim()) {
					return;
				}

				const parent = getNode(state.plan, parentPath);

				if (parent === state.plan && newName.toLowerCase() === 'favorites') {
					newName = 'favorites';
				}

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
					return 'directoryName' in e && e.directoryName === 'favorites';
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
						const entryName = 'gameName' in g ? g.gameName : g.directoryName;
						return newGameName.localeCompare(entryName) <= 0;
					});
					favDir.games.splice(destIndex, 0, catalogEntry);
					favDir.isExpanded = true;
				}

				state.isDirty = true;
			}
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
	(plan: Plan): PlanSliceThunk =>
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
			(ce) =>
				ce.manufacturer.includes('Capcom') && ce.orientation === 'horizontal'
		);

		const horizontalSegaEntries = allCatalogEntries.filter(
			(ce) =>
				ce.manufacturer.includes('Sega') && ce.orientation === 'horizontal'
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
	let entryValue;

	if (criteria.gameAspect === 'core') {
		entryValue = entry.files.rbf?.fileName;
	} else {
		entryValue = entry[criteria.gameAspect as keyof CatalogEntry];
	}

	if (entryValue === null || entryValue === undefined) {
		return false;
	}

	switch (criteria.gameAspect) {
		case 'manufacturer':
		case 'categories': {
			if (criteria.operator === 'is') {
				return (entryValue as string[]).some((ev) =>
					ev.toLowerCase().includes(criteria.value.toString().toLowerCase())
				);
			} else {
				return !(entryValue as string[]).some((ev) =>
					ev.toLowerCase().includes(criteria.value.toString().toLowerCase())
				);
			}
		}
		case 'orientation': {
			if (criteria.operator === 'is') {
				return (entryValue as 'vertical' | 'horizontal') === criteria.value;
			} else {
				return (entryValue as 'vertical' | 'horizontal') !== criteria.value;
			}
		}
		case 'yearReleased': {
			const yearValue = entryValue as number;
			switch (criteria.operator) {
				case 'gte': {
					return yearValue >= criteria.value;
				}
				case 'lte': {
					return yearValue <= criteria.value;
				}
				case 'is': {
					return yearValue === criteria.value;
				}
				case 'is-not': {
					return yearValue !== criteria.value;
				}
				default: {
					return false;
				}
			}
		}
		case 'core':
		case 'gameName': {
			const valS = entryValue as string;
			switch (criteria.operator) {
				case 'is': {
					return valS.toLowerCase().includes(criteria.value.toLowerCase());
				}
				case 'is-not': {
					return !valS.toLowerCase().includes(criteria.value.toLowerCase());
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

const bulkAdd =
	({
		criteria,
		destination,
	}: {
		criteria: BulkAddCriteria[];
		destination: string;
	}): PlanSliceThunk =>
	(dispatch, getState) => {
		const catalog = getState().catalog.catalog;
		const plan = getState().plan.present.plan;

		if (catalog && plan) {
			const entriesToAdd = getEntriesBasedOnCriteria(catalog, criteria);
			const path = destination
				.trim()
				.split('/')
				.map((seg) => seg.trim())
				.filter((seg) => !!seg);

			batchGroupBy.start();

			entriesToAdd.forEach((entry) => {
				dispatch(
					planSlice.actions.addCatalogEntry({
						parentPath: [plan.directoryName].concat(path),
						catalogEntry: entry,
					})
				);
			});

			batchGroupBy.end();
		}
	};

const reducer = planSlice.reducer;
const {
	setPlan,
	moveItem,
	deleteItem,
	addDirectory,
	planRename,
	directoryRename,
	toggleDirectoryExpansion,
	toggleFavorite,
} = planSlice.actions;

const undoableReducer = undoable(reducer, {
	filter: excludeAction([
		'plan/loadNewPlan',
		'plan/loadDemoPlan',
		'plan/savePlan',
		'plan/savePlanAs',
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
	moveItem,
	addDirectory,
	planRename,
	directoryRename,
	toggleDirectoryExpansion,
	toggleFavorite,
	bulkAdd,
	undo,
	redo,
};
export type { PlanState, BulkAddCriteria };
