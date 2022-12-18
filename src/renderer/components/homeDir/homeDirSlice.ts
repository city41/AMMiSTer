import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { AppState } from '../../store';

type LoadingState = 'dormant' | 'loading' | 'error' | 'success';
type HomeDirState = {
	loadState: LoadingState;
	files: string[];
};

const initialState: HomeDirState = {
	loadState: 'dormant',
	files: ['initial'],
};

const homeDirSlice = createSlice({
	name: 'homeDir',
	initialState,
	reducers: {
		setLoadState: (
			state: HomeDirState,
			action: PayloadAction<LoadingState>
		) => {
			state.loadState = action.payload;
		},
		setLoadedFiles: (state: HomeDirState, action: PayloadAction<string[]>) => {
			state.files = action.payload;
		},
	},
});

type HomeDirSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const loadHomeDirFiles = (): HomeDirSliceThunk => async (dispatch) => {
	dispatch(homeDirSlice.actions.setLoadState('loading'));

	try {
		const files = await window.ipcAPI?.getHomeDirFiles();

		dispatch(homeDirSlice.actions.setLoadedFiles(files));
		dispatch(homeDirSlice.actions.setLoadState('success'));
	} catch (e) {
		dispatch(homeDirSlice.actions.setLoadState('error'));
	}
};

const reducer = homeDirSlice.reducer;

export { reducer, loadHomeDirFiles };
export type { HomeDirState };
