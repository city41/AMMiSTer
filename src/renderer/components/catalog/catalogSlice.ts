import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import {
	Catalog,
	CatalogEntry,
	Update,
	UpdateStatus,
} from '../../../main/catalog/types';
import { AppState } from '../../store';

type CatalogState = {
	// undefined and null are crucially different
	// undefined -> unknown if there is a catalog or not, main has not told us
	// null -> main told us there is no catalog
	catalog: Catalog | null | undefined;
	updateCatalogStatus?: UpdateStatus;
	updates: Update[] | null;
	detailEntry: CatalogEntry | null;
};

const initialState: CatalogState = {
	catalog: undefined,
	updates: null,
	detailEntry: null,
};

const catalogSlice = createSlice({
	name: 'catalog',
	initialState,
	reducers: {
		setCatalog(state: CatalogState, action: PayloadAction<Catalog | null>) {
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
				...action.payload,
				complete: action.payload.complete ?? false,
			};
		},
		setDetailEntry(state: CatalogState, action: PayloadAction<CatalogEntry>) {
			state.detailEntry = action.payload;
		},
		clearDetailEntry(state: CatalogState) {
			state.detailEntry = null;
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

type CatalogSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const updateCatalog = (): CatalogSliceThunk => async (dispatch) => {
	dispatch(catalogSlice.actions.resetUpdateCatalogStatus());

	window.ipcAPI.updateCatalog((status) => {
		dispatch(catalogSlice.actions.setUpdateCatalogStatus(status));

		if (status.catalog) {
			dispatch(catalogSlice.actions.setCatalog(status.catalog));
		}

		if (status.updates) {
			dispatch(catalogSlice.actions.setUpdates(status.updates));
		}
	});
};

const getCurrentCatalog = (): CatalogSliceThunk => async (dispatch) => {
	const currentCatalog = await window.ipcAPI.getCurrentCatalog();

	dispatch(catalogSlice.actions.setCatalog(currentCatalog ?? null));
};

const reducer = catalogSlice.reducer;
const { setDetailEntry, clearDetailEntry } = catalogSlice.actions;

export {
	reducer,
	updateCatalog,
	getCurrentCatalog,
	setDetailEntry,
	clearDetailEntry,
};
export type { CatalogState };
