import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { AppState } from '../../store';

type LoadingState = 'dormant' | 'loading' | 'error' | 'success';
type MisterState = {
	loadState: LoadingState;
	games: string[];
};

const initialState: MisterState = {
	loadState: 'dormant',
	games: [],
};

const misterSlice = createSlice({
	name: 'mister',
	initialState,
	reducers: {
		setLoadState: (state: MisterState, action: PayloadAction<LoadingState>) => {
			state.loadState = action.payload;
		},
		setLoadedGames: (state: MisterState, action: PayloadAction<string[]>) => {
			state.games = action.payload;
		},
	},
});

type MisterSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const loadMisterGames =
	(ipAddress: string): MisterSliceThunk =>
	async (dispatch) => {
		dispatch(misterSlice.actions.setLoadState('loading'));

		try {
			const games = await window.ipcAPI?.getArcadeGamesOnMister(ipAddress);

			dispatch(misterSlice.actions.setLoadedGames(games));
			dispatch(misterSlice.actions.setLoadState('success'));
		} catch (e) {
			dispatch(misterSlice.actions.setLoadState('error'));
		}
	};

const reducer = misterSlice.reducer;

export { reducer, loadMisterGames };
export type { MisterState };
