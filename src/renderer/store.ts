import {
	CombinedState,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit';
import { reducer as dbReducer, DbState } from './components/db/dbSlice';

type AppState = CombinedState<{
	db: DbState;
}>;

const rootReducer = combineReducers({
	db: dbReducer,
});

const store = configureStore({
	reducer: rootReducer,
});

const dispatch = store.dispatch;

export { store, dispatch };
export type { AppState };
