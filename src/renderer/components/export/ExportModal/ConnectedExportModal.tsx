import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { exportToDirectory } from '../exportSlice';
import { AppState, dispatch } from '../../../store';

import { ExportModal } from './ExportModal';

function ConnectedExportModal() {
	const [modalClosed, setModalClosed] = useState(false);

	const { message, exportType, complete, error, canceled } = useSelector(
		(state: AppState) =>
			state.export.exportStatus ??
			({
				message: '',
				exportType: 'directory',
				complete: undefined,
				error: undefined,
				canceled: undefined,
			} as const)
	);

	useEffect(() => {
		window.ipcAPI.menu_exportToDirectory(() => {
			dispatch(exportToDirectory());
		});
	}, []);

	useEffect(() => {
		if (typeof complete === 'boolean') {
			setModalClosed(false);
		}
	}, [complete]);

	function handleCancelClick() {
		window.ipcAPI.cancelExport();
	}

	return (
		<ExportModal
			exportType={exportType}
			isOpen={typeof complete === 'boolean' && !modalClosed}
			message={message}
			error={error}
			canceled={canceled}
			complete={complete}
			onClose={() => setModalClosed(true)}
			onCancelClick={handleCancelClick}
		/>
	);
}

export { ConnectedExportModal };
