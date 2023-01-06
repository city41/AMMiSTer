import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { Catalog, CatalogEntry } from 'src/main/catalog/types';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
} from '../../../main/plan/types';
import { AppState } from '../../store';

type BulkAddCriteria = {
	gameAspect: 'manufacturer' | 'orientation' | 'yearReleased';
	operator: 'is' | 'is-not' | 'lte' | 'gte';
	value: string;
};

type PlanState = {
	plan: Plan | null;
};

const initialState: PlanState = {
	plan: null,
};

function getNode(plan: Plan, path: string[]): PlanGameDirectoryEntry {
	let dir: PlanGameDirectory = [plan];
	let foundDirEntry: PlanGameDirectoryEntry | undefined = undefined;

	for (const segment of path) {
		const dirEntry = dir.find((e) => {
			return 'directoryName' in e && e.directoryName === segment;
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

const planSlice = createSlice({
	name: 'plan',
	initialState,
	reducers: {
		setPlan(state: PlanState, action: PayloadAction<Plan>) {
			state.plan = action.payload;
		},
		addCatalogEntry(
			state: PlanState,
			action: PayloadAction<{
				parentPath: string[];
				catalogEntry: CatalogEntry;
			}>
		) {
			if (state.plan) {
				const { parentPath, catalogEntry } = action.payload;

				const parent = getNode(state.plan, parentPath);
				parent.games.push(catalogEntry);
				parent.games = parent.games.slice().sort();
			}
		},
		moveItem(
			state: PlanState,
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

				const prevIndex = prevParent.games.findIndex((g) => {
					if ('directoryName' in g) {
						return g.directoryName === name;
					} else {
						return g.gameName === name;
					}
				});

				const [movingNode] = prevParent.games.splice(prevIndex, 1);
				const movingNodeName =
					'gameName' in movingNode
						? movingNode.gameName
						: movingNode.directoryName;
				const destIndex = newParent.games.findIndex((g) => {
					const name = 'gameName' in g ? g.gameName : g.directoryName;
					return movingNodeName.localeCompare(name) <= 0;
				});
				newParent.games.splice(destIndex, 0, movingNode);
			}
		},
		deleteItem(
			state: PlanState,
			action: PayloadAction<{ parentPath: string[]; name: string }>
		) {
			if (state.plan) {
				const { parentPath, name } = action.payload;
				const parent = getNode(state.plan, parentPath);
				parent.games = parent.games.filter((g) => {
					if ('directoryName' in g) {
						return g.directoryName !== name;
					} else {
						return g.gameName !== name;
					}
				});
			}
		},
		addDirectory(
			state: PlanState,
			action: PayloadAction<{ parentPath: string[] }>
		) {
			if (state.plan) {
				const { parentPath } = action.payload;
				const parent = getNode(state.plan, parentPath);

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
			}
		},
		planRename(state: PlanState, action: PayloadAction<string>) {
			if (state.plan) {
				state.plan.directoryName = action.payload;
			}
		},
		directoryRename(
			state: PlanState,
			action: PayloadAction<{
				parentPath: string[];
				name: string;
				newName: string;
			}>
		) {
			if (state.plan) {
				const { parentPath, name, newName } = action.payload;

				const parent = getNode(state.plan, parentPath);

				const entry = parent.games.find((g) => {
					return 'directoryName' in g && g.directoryName === name;
				}) as PlanGameDirectoryEntry;

				if (entry) {
					entry.directoryName = newName;
				}
			}
		},
		toggleDirectoryExpansion(
			state: PlanState,
			action: PayloadAction<{ path: string[] }>
		) {
			if (state.plan) {
				const { path } = action.payload;
				const node = getNode(state.plan, path);
				node.isExpanded = !node.isExpanded;
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
		const plan = getState().plan.plan;
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

const loadNewPlan = (): PlanSliceThunk => async (dispatch) => {
	const plan = await window.ipcAPI.newPlan();
	plan.directoryName = 'New Plan';
	dispatch(planSlice.actions.setPlan(plan));
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

const savePlanAs = (): PlanSliceThunk => async (_dispatch, getState) => {
	const plan = getState().plan.plan;

	if (plan) {
		window.ipcAPI.savePlanAs(plan);
	}
};

const savePlan = (): PlanSliceThunk => async (_dispatch, getState) => {
	const plan = getState().plan.plan;

	if (plan) {
		window.ipcAPI.savePlan(plan);
	}
};

function matchesCriteria(
	entry: CatalogEntry,
	criteria: BulkAddCriteria
): boolean {
	const entryValue = String(entry[criteria.gameAspect as keyof CatalogEntry]);

	switch (criteria.operator) {
		case 'is': {
			return entryValue === criteria.value;
		}
		case 'is-not': {
			return entryValue !== criteria.value;
		}
		case 'gte': {
			return Number(entryValue) >= Number(criteria.value);
		}
		case 'lte': {
			return Number(entryValue) <= Number(criteria.value);
		}
	}
}

function getEntriesBasedOnCriteria(
	catalog: Catalog,
	criterias: BulkAddCriteria[]
): CatalogEntry[] {
	debugger;
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
		const plan = getState().plan.plan;

		if (catalog && plan) {
			const entriesToAdd = getEntriesBasedOnCriteria(catalog, criteria);
			const path = destination
				.trim()
				.split('/')
				.map((seg) => seg.trim())
				.filter((seg) => !!seg);

			entriesToAdd.forEach((entry) => {
				dispatch(
					planSlice.actions.addCatalogEntry({
						parentPath: [plan.directoryName].concat(path),
						catalogEntry: entry,
					})
				);
			});
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
} = planSlice.actions;

export {
	reducer,
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
	bulkAdd,
};
export type { PlanState, BulkAddCriteria };
