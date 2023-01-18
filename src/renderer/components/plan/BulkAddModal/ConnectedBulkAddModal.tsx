import React, { useState } from 'react';
import { BulkAddModal } from './BulkAddModal';
import { dispatch, AppState } from '../../../store';
import { BulkAddCriteria, bulkAdd } from '../planSlice';
import { useSelector } from 'react-redux';

type ConnectedBulkAddModalProps = {
	destination: string;
	isOpen: boolean;
	onClose: () => void;
};

function ConnectedBulkAddModal({
	destination,
	isOpen,
	onClose,
}: ConnectedBulkAddModalProps) {
	const [modalOpen, setModalOpen] = useState(isOpen);

	const catalog = useSelector((state: AppState) => {
		return state.catalog.catalog;
	});

	function handleApply(criteria: BulkAddCriteria[]) {
		dispatch(bulkAdd({ criteria, destination }));
		setModalOpen(false);
	}

	if (!catalog) {
		return null;
	}

	return (
		<BulkAddModal
			isOpen={modalOpen}
			destination={destination}
			catalog={catalog}
			onRequestClose={() => {
				setModalOpen(false);
				onClose();
			}}
			onApply={handleApply}
		/>
	);
}

export { ConnectedBulkAddModal };
