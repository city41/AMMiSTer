import React, { useEffect, useState } from 'react';
import { FileClientConnectConfig } from '../../../../main/export/types';
import { ExportRemoteConfigModal } from './ExportRemoteConfigModal';
import { exportToMister } from '../exportSlice';
import { dispatch } from '../../../store';

function ConnectedExportRemoteConfigModal() {
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		window.ipcAPI.menu_exportToMister(() => {
			setModalOpen(true);
		});
	}, [setModalOpen]);

	function handleExport(config: FileClientConnectConfig) {
		dispatch(exportToMister(config));
		setModalOpen(false);
	}

	return (
		<ExportRemoteConfigModal
			isOpen={modalOpen}
			onRequestClose={() => {
				setModalOpen(false);
			}}
			onExport={handleExport}
		/>
	);
}

export { ConnectedExportRemoteConfigModal };
