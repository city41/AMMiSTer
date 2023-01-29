import React, { useEffect, useState } from 'react';
import { FileClientConnectConfig } from '../../../../main/export/types';
import { ExportRemoteConfigModal } from './ExportRemoteConfigModal';
import { exportToMister } from '../exportSlice';
import { store, dispatch } from '../../../store';

function ConnectedExportRemoteConfigModal() {
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		window.ipcAPI.menu_exportToMister(() => {
			const plan = store.getState().plan.present.plan;
			if (plan) {
				if (plan.hasAnInvalidDescendant) {
					alert(
						'This plan has missing or corrupt files, try checking for updates, then loading the plan again'
					);
				} else {
					setModalOpen(true);
				}
			} else {
				alert('Please load or create a plan first');
			}
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
