import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import {
	ExportStatus,
	FileClientConnectConfig,
} from '../../../main/export/types';
import { AppState } from '../../store';

type ExportState = {
	exportStatus?: ExportStatus;
};

const initialState: ExportState = {};

const exportSlice = createSlice({
	name: 'export',
	initialState,
	reducers: {
		setExportStatus(state: ExportState, action: PayloadAction<ExportStatus>) {
			state.exportStatus = {
				exportType: action.payload.exportType,
				message: action.payload.message,
				complete: action.payload.complete ?? false,
				error: action.payload.error,
			};
		},
		resetExportStatus(state: ExportState) {
			state.exportStatus = {
				exportType: 'directory',
				message: '',
				complete: undefined,
			};
		},
	},
});

type ExportSliceThunk = ThunkAction<void, AppState, undefined, AnyAction>;

const exportToDirectory =
	(): ExportSliceThunk => async (dispatch, getState) => {
		const plan = getState().plan.present.plan;

		if (plan) {
			if (plan.hasAnInvalidDescendant) {
				alert(
					'This plan has missing or corrupt files, try checking for updates, then loading the plan again'
				);
			} else {
				dispatch(exportSlice.actions.resetExportStatus());

				window.ipcAPI.exportToDirectory(plan, (status) => {
					dispatch(
						exportSlice.actions.setExportStatus({
							...status,
							exportType: 'directory',
						})
					);
					return true;
				});
			}
		} else {
			alert('Please load or create a plan first');
		}
	};

const exportToMister =
	(config: FileClientConnectConfig): ExportSliceThunk =>
	async (dispatch, getState) => {
		const plan = getState().plan.present.plan;

		if (plan) {
			dispatch(exportSlice.actions.resetExportStatus());

			window.ipcAPI.exportToMister(plan, config, (status) => {
				dispatch(
					exportSlice.actions.setExportStatus({
						...status,
						exportType: 'mister',
					})
				);
				return true;
			});
		} else {
			alert('Please load or create a plan first');
		}
	};

const reducer = exportSlice.reducer;

export { reducer, exportToDirectory, exportToMister };
export type { ExportState };
