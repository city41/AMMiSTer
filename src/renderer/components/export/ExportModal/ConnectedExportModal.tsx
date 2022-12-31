import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { exportToDirectory } from '../exportSlice';
import { AppState, dispatch } from '../../../store';

import { ExportModal } from './ExportModal';

function ConnectedExportModal() {
	const [modalClosed, setModalClosed] = useState(false);

	const { message, exportType, complete } = useSelector(
		(state: AppState) =>
			state.export.exportToDirectoryStatus ??
			({
				message: '',
				exportType: 'directory',
				complete: undefined,
			} as const)
	);

	useEffect(() => {
		window.ipcAPI.menu_exportToDirectory(() => {
			console.log('menu_exportToDirectoy callback called');
			dispatch(exportToDirectory());
		});
	}, []);

	useEffect(() => {
		if (typeof complete === 'boolean') {
			setModalClosed(false);
		}
	}, [complete]);

	return (
		<ExportModal
			exportType={exportType}
			isOpen={typeof complete === 'boolean' && !modalClosed}
			message={message}
			complete={complete}
			onClose={() => setModalClosed(true)}
		/>
	);
}

export { ConnectedExportModal };
