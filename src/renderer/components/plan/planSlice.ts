import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { Plan } from '../../../main/plan/types';
import { AppState } from '../../store';

type PlanState = {
	plan: Plan | null;
};

const initialState: PlanState = {
	plan: null,
};

const planSlice = createSlice({
	name: 'plan',
	initialState,
	reducers: {
		setPlan(state: PlanState, action: PayloadAction<Plan>) {
			state.plan = action.payload;
		},
	},
});

type PlanSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const newPlan = (): PlanSliceThunk => async (dispatch) => {
	const plan = await window.ipcAPI.newPlan();
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

		const olderGames = horizontalCapcomEntries.filter(
			(ce) => ce.yearReleased < 1994
		);
		const newerGames = horizontalCapcomEntries.filter(
			(ce) => ce.yearReleased >= 1994
		);

		const oldestYear = Math.min(...olderGames.map((og) => og.yearReleased));
		const newestYear = Math.max(...newerGames.map((ng) => ng.yearReleased));

		plan.name = 'Demo Plan';
		plan.games = [
			{
				directoryName: 'Capcom',
				games: [
					{
						directoryName: `${oldestYear} - 1993`,
						games: olderGames,
					},
					{
						directoryName: `1994 - ${newestYear}`,
						games: newerGames,
					},
				],
			},
		];

		dispatch(planSlice.actions.setPlan(plan));
	}
};

const reducer = planSlice.reducer;

export { reducer, newPlan, loadDemoPlan };
export type { PlanState };
