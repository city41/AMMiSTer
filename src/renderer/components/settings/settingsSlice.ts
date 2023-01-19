import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { Settings, SettingsValue } from '../../../main/settings/types';
import { AppState } from '../../store';

type SettingsState = {
	settings: Settings | null;
};

const initialState: SettingsState = {
	settings: null,
};

const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		setSettings(state: SettingsState, action: PayloadAction<Settings | null>) {
			state.settings = action.payload;
		},
	},
});

type SettingsSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const getAllSettings = (): SettingsSliceThunk => async (dispatch) => {
	const allSettings = await window.ipcAPI.getAllSettings();
	dispatch(settingsSlice.actions.setSettings(allSettings));
};

const setAllSettings =
	(newSettings: Settings): SettingsSliceThunk =>
	async (dispatch) => {
		await window.ipcAPI.setAllSettings(newSettings);
		const newlyGrabbedSettings = await window.ipcAPI.getAllSettings();
		dispatch(settingsSlice.actions.setSettings(newlyGrabbedSettings));
	};

const setSetting =
	(key: keyof Settings, value: SettingsValue): SettingsSliceThunk =>
	async (dispatch) => {
		await window.ipcAPI.setSetting(key, value);
		const newlyGrabbedSettings = await window.ipcAPI.getAllSettings();
		dispatch(settingsSlice.actions.setSettings(newlyGrabbedSettings));
	};

const reducer = settingsSlice.reducer;

export { reducer, getAllSettings, setAllSettings, setSetting };
export type { SettingsState };
