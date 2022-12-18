import {
	CombinedState,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit';
import {
	reducer as misterReducer,
	MisterState,
} from './components/mister/misterSlice';

type AppState = CombinedState<{
	mister: MisterState;
}>;

const rootReducer = combineReducers({
	mister: misterReducer,
});

const store = configureStore({
	reducer: rootReducer,
});

const dispatch = store.dispatch;

export { store, dispatch };
export type { AppState };
