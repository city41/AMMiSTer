import React, { useEffect, useState } from 'react';
import { BulkAddModal } from './BulkAddModal';
import { store, dispatch } from '../../../store';
import { BulkAddCriteria, bulkAdd } from '../planSlice';

function ConnectedBulkAddModal() {
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		window.ipcAPI.menu_kickOffBulkAdd(() => {
			const plan = store.getState().plan.plan;
			if (plan) {
				setModalOpen(true);
			} else {
				alert('Please load or create a plan first');
			}
		});
	}, []);

	function handleApply(args: {
		criteria: BulkAddCriteria[];
		destination: string;
	}) {
		dispatch(bulkAdd(args));
		setModalOpen(false);
	}

	return (
		<BulkAddModal
			isOpen={modalOpen}
			onRequestClose={() => setModalOpen(false)}
			onApply={handleApply}
		/>
	);
}

export { ConnectedBulkAddModal };
