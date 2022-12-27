import {
	CombinedState,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit';
import {
	reducer as catalogReducer,
	CatalogState,
} from './components/catalog/catalogSlice';

type AppState = CombinedState<{
	catalog: CatalogState;
}>;

const rootReducer = combineReducers({
	catalog: catalogReducer,
});

const store = configureStore({
	reducer: rootReducer,
});

const dispatch = store.dispatch;

export { store, dispatch };
export type { AppState };
