import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { AppState } from '../../store';

type ExportType = 'directory' | 'mister';

type ExportToDirectoryStatus = {
	exportType: ExportType;
	message: string;
	complete?: boolean;
};

type ExportState = {
	exportToDirectoryStatus?: ExportToDirectoryStatus;
};

const initialState: ExportState = {};

const exportSlice = createSlice({
	name: 'export',
	initialState,
	reducers: {
		setExportToDirectoryStatus(
			state: ExportState,
			action: PayloadAction<ExportToDirectoryStatus>
		) {
			state.exportToDirectoryStatus = {
				exportType: action.payload.exportType,
				message: action.payload.message,
				complete: action.payload.complete ?? false,
			};
		},
		resetExportToDirectoryStatus(state: ExportState) {
			state.exportToDirectoryStatus = {
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
		const plan = getState().plan.plan;

		if (plan) {
			dispatch(exportSlice.actions.resetExportToDirectoryStatus());

			window.ipcAPI.exportToDirectory(plan, (status) => {
				dispatch(
					exportSlice.actions.setExportToDirectoryStatus({
						...status,
						exportType: 'directory',
					})
				);
			});
		}
	};

const reducer = exportSlice.reducer;

export { reducer, exportToDirectory };
export type { ExportState, ExportType };
