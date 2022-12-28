import {
	CombinedState,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit';
import {
	reducer as catalogReducer,
	CatalogState,
} from './components/catalog/catalogSlice';
import { reducer as planReducer, PlanState } from './components/plan/planSlice';

type AppState = CombinedState<{
	catalog: CatalogState;
	plan: PlanState;
}>;

const rootReducer = combineReducers({
	catalog: catalogReducer,
	plan: planReducer,
});

const store = configureStore({
	reducer: rootReducer,
});

const dispatch = store.dispatch;

export { store, dispatch };
export type { AppState };
