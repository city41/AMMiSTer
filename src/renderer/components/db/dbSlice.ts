import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { AppState } from '../../store';

type DB = Record<string, unknown>;

type LoadingState = 'dormant' | 'loading' | 'error' | 'success';
type DbState = {
	loadState: LoadingState;
	dbs: Record<string, DB>;
	catalog: Record<string, unknown>;
};

const dbs: Record<string, string> = {
	distribution_mister:
		'https://raw.githubusercontent.com/MiSTer-devel/Distribution_MiSTer/main/db.json.zip',
	jtcores:
		'https://raw.githubusercontent.com/jotego/jtcores_mister/main/jtbindb.json.zip',
};

const initialState: DbState = {
	loadState: 'dormant',
	dbs: {},
	catalog: {},
};

const dbSlice = createSlice({
	name: 'db',
	initialState,
	reducers: {
		setLoadState(state: DbState, action: PayloadAction<LoadingState>) {
			state.loadState = action.payload;
		},
		setLoadedDb(
			state: DbState,
			action: PayloadAction<{ name: string; db: DB }>
		) {
			const { name, db } = action.payload;
			state.dbs[name] = db;
		},
		setCatalog(state: DbState, action: PayloadAction<any>) {
			state.catalog = action.payload;
		},
	},
});

type DbSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const loadDb =
	(name: string): DbSliceThunk =>
	async (dispatch) => {
		dispatch(dbSlice.actions.setLoadState('loading'));

		try {
			const db = await window.ipcAPI?.getDbJson(dbs[name]);

			dispatch(dbSlice.actions.setLoadedDb({ name, db }));
			dispatch(dbSlice.actions.setLoadState('success'));
		} catch (e) {
			dispatch(dbSlice.actions.setLoadState('error'));
		}
	};

const updateDb =
	(db: any): DbSliceThunk =>
	async (dispatch) => {
		dispatch(dbSlice.actions.setLoadState('loading'));

		try {
			await window.ipcAPI?.downloadUpdatesForDb(db);
			dispatch(dbSlice.actions.setLoadState('success'));
		} catch (e) {
			dispatch(dbSlice.actions.setLoadState('error'));
		}
	};

const buildGameCatalog = (): DbSliceThunk => async (dispatch) => {
	dispatch(dbSlice.actions.setLoadState('loading'));

	try {
		const catalog = await window.ipcAPI?.buildGameCatalog();

		dispatch(dbSlice.actions.setCatalog(catalog));
		dispatch(dbSlice.actions.setLoadState('success'));
	} catch (e) {
		dispatch(dbSlice.actions.setLoadState('error'));
	}
};

const reducer = dbSlice.reducer;

export { reducer, loadDb, updateDb, buildGameCatalog };
export type { DbState };
