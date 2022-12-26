import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { Catalog, Update } from '../../../main/db/types';
import { AppState } from '../../store';

type UpdateStatus = {
	message: string;
	complete?: boolean;
};

type DbState = {
	catalog: Catalog;
	updateCatalogStatus?: UpdateStatus;
	updates: Update[] | null;
};

const initialState: DbState = {
	catalog: {},
	updates: null,
};

const dbSlice = createSlice({
	name: 'db',
	initialState,
	reducers: {
		setCatalog(state: DbState, action: PayloadAction<Catalog>) {
			state.catalog = action.payload;
		},
		setUpdates(state: DbState, action: PayloadAction<Update[]>) {
			state.updates = action.payload;
		},
		setUpdateCatalogStatus(
			state: DbState,
			action: PayloadAction<UpdateStatus>
		) {
			state.updateCatalogStatus = {
				message: action.payload.message,
				complete: action.payload.complete ?? false,
			};
		},
		resetUpdateCatalogStatus(state: DbState) {
			state.updateCatalogStatus = {
				message: '',
				complete: undefined,
			};
			state.updates = null;
		},
	},
});

type DbSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const updateCatalog = (): DbSliceThunk => async (dispatch) => {
	dispatch(dbSlice.actions.resetUpdateCatalogStatus());

	window.ipcAPI?.updateCatalog((status) => {
		dispatch(dbSlice.actions.setUpdateCatalogStatus(status));

		if (status.catalog) {
			dispatch(dbSlice.actions.setCatalog(status.catalog));
		}

		if (status.updates) {
			dispatch(dbSlice.actions.setUpdates(status.updates));
		}
	});
};

const reducer = dbSlice.reducer;

export { reducer, updateCatalog };
export type { DbState };
