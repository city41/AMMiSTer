import {
	CombinedState,
	combineReducers,
	configureStore,
	getDefaultMiddleware,
} from '@reduxjs/toolkit';
import {
	reducer as homeDirReducer,
	HomeDirState,
} from './components/homeDir/homeDirSlice';

type AppState = CombinedState<{
	homeDir: HomeDirState;
}>;

const rootReducer = combineReducers({
	homeDir: homeDirReducer,
});

const store = configureStore({
	reducer: rootReducer,
});

const dispatch = store.dispatch;

export { store, dispatch };
export type { AppState };
