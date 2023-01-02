import React, { useEffect, useState } from 'react';
import { SambaConfig } from '../../../../main/export/types';
import { ExportSambaConfigModal } from './ExportSambaConfigModal';
import { exportToMister } from '../exportSlice';
import { dispatch } from '../../../store';

function ConnectedExportSambaConfigModal() {
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		window.ipcAPI.menu_exportToMister(() => {
			setModalOpen(true);
		});
	}, [setModalOpen]);

	function handleExport(config: SambaConfig) {
		dispatch(exportToMister(config));
		setModalOpen(false);
	}

	return (
		<ExportSambaConfigModal
			isOpen={modalOpen}
			onRequestClose={() => {
				setModalOpen(false);
			}}
			onExport={handleExport}
		/>
	);
}

export { ConnectedExportSambaConfigModal };
