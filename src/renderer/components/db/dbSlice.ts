import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { AppState } from '../../store';

type DB = Record<string, unknown>;

type LoadingState = 'dormant' | 'loading' | 'error' | 'success';
type DbState = {
	loadState: LoadingState;
	dbs: Record<string, DB>;
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
};

const dbSlice = createSlice({
	name: 'db',
	initialState,
	reducers: {
		setLoadState: (state: DbState, action: PayloadAction<LoadingState>) => {
			state.loadState = action.payload;
		},
		setLoadedDb: (
			state: DbState,
			action: PayloadAction<{ name: string; db: DB }>
		) => {
			const { name, db } = action.payload;
			state.dbs[name] = db;
		},
	},
});

type DbSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const loadDb =
	(name: string): DbSliceThunk =>
	async (dispatch) => {
		dispatch(dbSlice.actions.setLoadState('loading'));

		try {
			const db = await window.ipcAPI?.getUpdateJson(dbs[name]);

			dispatch(dbSlice.actions.setLoadedDb({ name, db }));
			dispatch(dbSlice.actions.setLoadState('success'));
		} catch (e) {
			dispatch(dbSlice.actions.setLoadState('error'));
		}
	};

const reducer = dbSlice.reducer;

export { reducer, loadDb };
export type { DbState };
