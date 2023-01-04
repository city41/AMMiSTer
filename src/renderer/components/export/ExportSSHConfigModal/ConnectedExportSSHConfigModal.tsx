import React, { useEffect, useState } from 'react';
import { SSHConfig } from '../../../../main/export/types';
import { ExportSSHConfigModal } from './ExportSSHConfigModal';
import { exportToMister } from '../exportSlice';
import { dispatch } from '../../../store';

function ConnectedExportSSHConfigModal() {
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		window.ipcAPI.menu_exportToMister(() => {
			setModalOpen(true);
		});
	}, [setModalOpen]);

	function handleExport(config: SSHConfig) {
		dispatch(exportToMister(config));
		setModalOpen(false);
	}

	return (
		<ExportSSHConfigModal
			isOpen={modalOpen}
			onRequestClose={() => {
				setModalOpen(false);
			}}
			onExport={handleExport}
		/>
	);
}

export { ConnectedExportSSHConfigModal };
