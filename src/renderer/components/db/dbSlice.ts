import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { AppState } from '../../store';

type DB = Record<string, unknown>;

type UpdateStatus = {
	message: string;
	complete?: boolean;
};

type DbState = {
	catalog: Record<string, unknown>;
	updateStatus?: UpdateStatus;
};

const initialState: DbState = {
	catalog: {},
};

const dbSlice = createSlice({
	name: 'db',
	initialState,
	reducers: {
		setCatalog(state: DbState, action: PayloadAction<any>) {
			state.catalog = action.payload;
		},
		setUpdateStatus(state: DbState, action: PayloadAction<UpdateStatus>) {
			state.updateStatus = {
				message: action.payload.message,
				complete: action.payload.complete ?? false,
			};
		},
	},
});

type DbSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const updateCatalog = (): DbSliceThunk => async (dispatch) => {
	window.ipcAPI?.updateCatalog((status) => {
		dispatch(dbSlice.actions.setUpdateStatus(status));

		if (status.catalog) {
			dispatch(dbSlice.actions.setCatalog(status.catalog));
		}
	});
};

const reducer = dbSlice.reducer;

export { reducer, updateCatalog };
export type { DbState };
