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

const loadNewPlan = (): PlanSliceThunk => async (dispatch) => {
	const plan = await window.ipcAPI.newPlan();
	plan.name = 'New Plan';
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
			ce.category?.includes('Fight')
		);
		const capcomShooters = horizontalCapcomEntries.filter((ce) =>
			ce.category?.includes('Shoot')
		);
		const segaShooters = horizontalSegaEntries.filter((ce) =>
			ce.category?.includes('Shoot')
		);

		plan.name = 'Demo Plan';
		plan.games = [
			{
				directoryName: 'Capcom',
				games: [
					{
						directoryName: 'Fighters',
						games: capcomFighters,
					},
					{
						directoryName: 'Horizontal Shooters',
						games: capcomShooters,
					},
				],
			},
			{
				directoryName: 'Sega',
				games: [
					{
						directoryName: 'Horizontal Shooters',
						games: segaShooters,
					},
				],
			},
		];

		dispatch(planSlice.actions.setPlan(plan));
	}
};

const reducer = planSlice.reducer;
const { setPlan } = planSlice.actions;

export { reducer, loadNewPlan, loadDemoPlan, setPlan };
export type { PlanState };
