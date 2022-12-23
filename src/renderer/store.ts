import {
	CombinedState,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit';
import {
	reducer as misterReducer,
	MisterState,
} from './components/mister/misterSlice';
import { reducer as dbReducer, DbState } from './components/db/dbSlice';

type AppState = CombinedState<{
	mister: MisterState;
	db: DbState;
}>;

const rootReducer = combineReducers({
	mister: misterReducer,
	db: dbReducer,
});

const store = configureStore({
	reducer: rootReducer,
});

const dispatch = store.dispatch;

export { store, dispatch };
export type { AppState };
