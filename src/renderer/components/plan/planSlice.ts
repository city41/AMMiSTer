import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import undoable, {
	ActionCreators,
	StateWithHistory,
	excludeAction,
} from 'redux-undo';
import { Catalog, CatalogEntry } from '../../../main/catalog/types';
import { getAllCatalogEntries } from '../../../main/catalog/util';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
	PlanGameEntry,
} from '../../../main/plan/types';
import { AppState } from '../../store';
import { BatchGroupBy } from './BatchGroupBy';
import { MissingGameToResolve } from './ResolveMissingGames/ResolveMissingGameEntry';

const batchGroupBy = new BatchGroupBy();

const NOT_SET_SENTINEL = '__NOT__SET__Criteria_Value__';

type DbIdBulkAddCriteria = {
	gameAspect: 'db_id';
	operator: 'is' | 'is-not';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type NumberOfPlayersBulkAddCriteria = {
	gameAspect: 'players';
	operator: 'is' | 'is-not';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type ResolutionBulkAddCriteria = {
	gameAspect: 'resolution';
	operator: 'is' | 'is-not';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
};

type RotationBulkAddCriteria = {
	gameAspect: 'rotation';
	operator: 'is' | 'is-not';
	value:
		| 'horizontal'
		| 'horizontal-flippable'
		| 'horizontal-180'
		| 'horizontal-180-flippable'
		| 'all-vertical'
		| 'all-vertical-flippable'
		| 'cw-vertical'
		| 'cw-vertical-flippable'
		| 'ccw-vertical'
		| 'ccw-vertical-flippable'
		| 'flippable';
};

type StringArrayBulkAddCriteria = {
	gameAspect:
		| 'manufacturer'
		| 'category'
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
	| DbIdBulkAddCriteria
	| NumberOfPlayersBulkAddCriteria
	| ResolutionBulkAddCriteria
	| RotationBulkAddCriteria
	| StringArrayBulkAddCriteria
	| StringBulkAddCriteria
	| NumberBulkAddCriteria;

type PlanMode = 'tree' | 'resolve';

type InternalPlanState = {
	mode: PlanMode;
	// undefined and null are crucially different
	// undefined -> unknown if there is a plan or not, main has not told us
	// null -> main told us there is no plan
	plan: Plan | null | undefined;
	planPath: string | null;
	isDirty: boolean;
	criteriaMatch: CatalogEntry[] | null;
	missingDetailEntry: PlanGameEntry | null;
};

type PlanState = StateWithHistory<InternalPlanState>;

const initialState: InternalPlanState = {
	mode: 'tree',
	plan: undefined,
	planPath: null,
	isDirty: false,
	criteriaMatch: null,
	missingDetailEntry: null,
};

function getAllGamesInPlan(planDir: PlanGameDirectory): PlanGameEntry[] {
	const games: PlanGameEntry[] = [];

	for (const entry of planDir) {
		if ('games' in entry) {
			const subGames = getAllGamesInPlan(entry.games);
			games.push(...subGames);
		} else {
			// TODO; what about missing games?
			games.push(entry);
		}
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

function getEntryName(entry: PlanGameDirectoryEntry | PlanGameEntry): string {
	if ('games' in entry) {
		return entry.directoryName;
	}

	return entry.relFilePath;
}

const planSlice = createSlice({
	name: 'plan',
	initialState,
	reducers: {
		setMode(state: InternalPlanState, action: PayloadAction<PlanMode>) {
			state.mode = action.payload;
		},
		clearDirty(state: InternalPlanState) {
			state.isDirty = false;
		},
		setPlan(state: InternalPlanState, action: PayloadAction<Plan | null>) {
			if (action.payload !== state.plan) {
				state.plan = action.payload;
				state.isDirty = false;
				state.mode = 'tree';
			}
		},
		setPlanPath(
			state: InternalPlanState,
			action: PayloadAction<string | null>
		) {
			state.planPath = action.payload;
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
						'relFilePath' in g &&
						g.relFilePath === catalogEntry.files.mra.relFilePath
				);

				if (!alreadyInParent) {
					parent.games.push({
						db_id: catalogEntry.db_id,
						relFilePath: catalogEntry.files.mra.relFilePath,
					});
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
						// TODO: should probably disallow moving missing games
						// which will have missing: true
						return g.relFilePath === name;
					}
				});

				const entry = prevParent.games[prevIndex];
				const movingNodeName = getEntryName(entry);

				if ('relFilePath' in entry) {
					const alreadyInParent = newParent.games.some(
						(g) => getEntryName(g) === entry.relFilePath
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

				const existingFoldersWithNewName = parent.games.filter((g) => {
					return (
						'directoryName' in g &&
						g.directoryName.toLowerCase() === newName.toLowerCase()
					);
				});

				// about to rename a folder to a name that is already in this directory.
				// for now, just don't allow this
				// TODO: merge the two directories together
				if (existingFoldersWithNewName.length > 0) {
					return;
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
					return (
						'directoryName' in e &&
						e.directoryName.toLowerCase() === 'favorites'
					);
				}) as PlanGameDirectoryEntry;

				const currentIndex = favDir.games.findIndex((g) => {
					return (
						'relFilePath' in g &&
						g.relFilePath === catalogEntry.files.mra.relFilePath
					);
				});

				if (currentIndex > -1) {
					favDir.games.splice(currentIndex, 1);
				} else {
					favDir.games.push({
						db_id: catalogEntry.db_id,
						relFilePath: catalogEntry.files.mra.relFilePath,
					});
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
			action: PayloadAction<PlanGameEntry>
		) {
			state.missingDetailEntry = action.payload;
		},
		clearMissingDetailEntry(state: InternalPlanState) {
			state.missingDetailEntry = null;
		},
		resolveMissingGames(
			state: InternalPlanState,
			action: PayloadAction<MissingGameToResolve[]>
		) {
			if (state.plan) {
				const missingGamesToResolve = action.payload;

				missingGamesToResolve.forEach((mg) => {
					const parent = getNode(
						state.plan!,
						[state.plan!.directoryName].concat(mg.planPath.split('/'))
					);

					const initialCount = parent.games.length;

					parent.games = parent.games.filter((g) => {
						return 'games' in g || g.relFilePath !== mg.mraPath;
					});

					state.isDirty = state.isDirty || initialCount > parent.games.length;

					if (mg.replacementEntry) {
						parent.games.push({
							db_id: mg.replacementEntry.db_id,
							relFilePath: mg.replacementEntry.files.mra.relFilePath,
						});
						state.isDirty = true;
					}
				});
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
			const db = catalog[db_id];
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
	dispatch(planSlice.actions.setPlanPath(null));
	dispatch(ActionCreators.clearHistory());
};

const loadOpenedPlan =
	({
		plan,
		planPath,
	}: {
		plan: Plan | null;
		planPath: string | null;
	}): PlanSliceThunk =>
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
		dispatch(planSlice.actions.setPlanPath(planPath));
		dispatch(ActionCreators.clearHistory());
	};

const loadDemoPlan = (): PlanSliceThunk => async (dispatch, getState) => {
	const catalog = getState().catalog.catalog;

	if (catalog) {
		const plan = await window.ipcAPI.newPlan();

		const allCatalogEntries = getAllCatalogEntries(catalog);

		const horizontalCapcomEntries = allCatalogEntries.filter(
			(ce) => ce.manufacturer.includes('Capcom') && ce.rotation === 0
		);

		const horizontalSegaEntries = allCatalogEntries.filter(
			(ce) => ce.manufacturer.includes('Sega') && ce.rotation === 0
		);

		const capcomFighters = horizontalCapcomEntries
			.filter((ce) => ce.category.some((c) => c.includes('Fight')))
			.map((ce) => {
				return {
					db_id: ce.db_id,
					relFilePath: ce.files.mra.relFilePath,
				};
			});
		const capcomShooters = horizontalCapcomEntries
			.filter((ce) => ce.category.some((c) => c.includes('Shoot')))
			.map((ce) => {
				return {
					db_id: ce.db_id,
					relFilePath: ce.files.mra.relFilePath,
				};
			});
		const segaShooters = horizontalSegaEntries
			.filter((ce) => ce.category.some((c) => c.includes('Shoot')))
			.map((ce) => {
				return {
					db_id: ce.db_id,
					relFilePath: ce.files.mra.relFilePath,
				};
			});

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
		const { wasSaved, planPath } = await window.ipcAPI.savePlanAs(plan);

		if (wasSaved) {
			dispatch(planSlice.actions.clearDirty());
			dispatch(planSlice.actions.setPlanPath(planPath));
		}
	}
};

const savePlan = (): PlanSliceThunk => async (dispatch, getState) => {
	const plan = getState().plan.present.plan;

	if (plan) {
		const { wasSaved, planPath } = await window.ipcAPI.savePlan(plan);

		if (wasSaved) {
			dispatch(planSlice.actions.clearDirty());
			dispatch(planSlice.actions.setPlanPath(planPath));
		}
	}
};

function matchesCriteria(
	entry: CatalogEntry,
	criteria: BulkAddCriteria
): boolean {
	const entryValue = entry[criteria.gameAspect as keyof CatalogEntry];

	if (criteria.value === NOT_SET_SENTINEL) {
		if (Array.isArray(entryValue)) {
			return entryValue.length === 0;
		} else {
			// !entryValue will not work, as 0 is a valid rotation value
			return (
				entryValue === null ||
				entryValue === undefined ||
				entryValue.toString().trim() === ''
			);
		}
	}

	switch (criteria.gameAspect) {
		case 'manufacturer':
		case 'series':
		case 'move_inputs':
		case 'special_controls':
		case 'platform':
		case 'category': {
			if (criteria.operator === 'is') {
				return (entryValue as string[]).some((ev) => ev === criteria.value);
			} else {
				return !(entryValue as string[]).some((ev) => ev === criteria.value);
			}
		}
		case 'rotation': {
			if (criteria.operator === 'is') {
				switch (criteria.value) {
					case 'horizontal':
						return entryValue === 0;
					case 'horizontal-flippable':
						return entryValue === 0 && entry.flip;
					case 'horizontal-180':
						return entryValue === 180;
					case 'horizontal-180-flippable':
						return entryValue === 180 && entry.flip;
					case 'all-vertical':
						return entryValue === 90 || entryValue === 270;
					case 'all-vertical-flippable':
						return (entryValue === 90 || entryValue === 270) && entry.flip;
					case 'ccw-vertical':
						return entryValue === 270;
					case 'ccw-vertical-flippable':
						return entryValue === 270 && entry.flip;
					case 'cw-vertical':
						return entryValue === 90;
					case 'cw-vertical-flippable':
						return entryValue === 90 && entry.flip;
					case 'flippable':
						return entry.flip;
					default:
						return false;
				}
			} else {
				// important to do entry.flip === false to explicitly find
				// games that have indicated they are not flippable, versus
				// flip just not being known (ie null or undefined)
				switch (criteria.value) {
					case 'horizontal':
						return entryValue !== 0;
					case 'horizontal-flippable':
						return entryValue !== 0 && entry.flip === false;
					case 'horizontal-180':
						return entryValue !== 180;
					case 'horizontal-180-flippable':
						return entryValue !== 180 && entry.flip === false;
					case 'all-vertical':
						return entryValue !== 90 && entryValue !== 270;
					case 'all-vertical-flippable':
						return (
							entryValue !== 90 && entryValue !== 270 && entry.flip === false
						);
					case 'ccw-vertical':
						return entryValue !== 270;
					case 'ccw-vertical-flippable':
						return entryValue !== 270 && entry.flip === false;
					case 'cw-vertical':
						return entryValue !== 90;
					case 'cw-vertical-flippable':
						return entryValue !== 90 && entry.flip === false;
					case 'flippable':
						return entry.flip === false;
					default:
						return false;
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
		case 'db_id':
		case 'region':
		case 'resolution':
		case 'players':
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
	const allEntries = getAllCatalogEntries(catalog);

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
						(g) => g.relFilePath !== entry.files.mra.relFilePath
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
	setMode,
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
	resolveMissingGames,
} = planSlice.actions;

const undoableReducer = undoable(reducer, {
	filter: excludeAction([
		'plan/loadNewPlan',
		'plan/loadDemoPlan',
		'plan/savePlan',
		'plan/savePlanAs',
		'plan/buildCriteriaMatch',
		planSlice.actions.setMode.toString(),
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
	setMode,
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
	resolveMissingGames,
	undo,
	redo,
	getAllGamesInPlan,
	NOT_SET_SENTINEL,
};
export type { PlanState, BulkAddCriteria, PlanMode };
