import {
	CombinedState,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit';
import {
	reducer as catalogReducer,
	CatalogState,
} from './components/catalog/catalogSlice';
import {
	reducer as exportReducer,
	ExportState,
} from './components/export/exportSlice';
import { reducer as planReducer, PlanState } from './components/plan/planSlice';
import {
	reducer as settingsReducer,
	SettingsState,
} from './components/settings/settingsSlice';

type AppState = CombinedState<{
	catalog: CatalogState;
	plan: PlanState;
	export: ExportState;
	settings: SettingsState;
}>;

const rootReducer = combineReducers({
	catalog: catalogReducer,
	plan: planReducer,
	export: exportReducer,
	settings: settingsReducer,
});

const store = configureStore({
	reducer: rootReducer,
});

const dispatch = store.dispatch;

export { store, dispatch };
export type { AppState };
