import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { Catalog, Update } from '../../../main/db/types';
import { AppState } from '../../store';

type UpdateStatus = {
	message: string;
	complete?: boolean;
};

type CatalogState = {
	catalog: Catalog | null;
	updateCatalogStatus?: UpdateStatus;
	updates: Update[] | null;
};

const initialState: CatalogState = {
	catalog: null,
	updates: null,
};

const catalogSlice = createSlice({
	name: 'catalog',
	initialState,
	reducers: {
		setCatalog(state: CatalogState, action: PayloadAction<Catalog>) {
			state.catalog = action.payload;
		},
		setUpdates(state: CatalogState, action: PayloadAction<Update[]>) {
			state.updates = action.payload;
		},
		setUpdateCatalogStatus(
			state: CatalogState,
			action: PayloadAction<UpdateStatus>
		) {
			state.updateCatalogStatus = {
				message: action.payload.message,
				complete: action.payload.complete ?? false,
			};
		},
		resetUpdateCatalogStatus(state: CatalogState) {
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
	dispatch(catalogSlice.actions.resetUpdateCatalogStatus());

	window.ipcAPI?.updateCatalog((status) => {
		dispatch(catalogSlice.actions.setUpdateCatalogStatus(status));

		if (status.catalog) {
			dispatch(catalogSlice.actions.setCatalog(status.catalog));
		}

		if (status.updates) {
			dispatch(catalogSlice.actions.setUpdates(status.updates));
		}
	});
};

const reducer = catalogSlice.reducer;

export { reducer, updateCatalog };
export type { CatalogState };
