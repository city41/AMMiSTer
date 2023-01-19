import React, { useState } from 'react';
import { BulkAddModal } from './BulkAddModal';
import { dispatch, AppState } from '../../../store';
import {
	BulkAddCriteria,
	bulkAdd,
	buildCriteriaMatch,
	resetCriteriaMatch,
} from '../planSlice';
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

	const criteriaMatch = useSelector((state: AppState) => {
		return state.plan.present.criteriaMatch;
	});

	function handleApply(criteria: BulkAddCriteria[]) {
		dispatch(bulkAdd({ criteria, destination }));
		setModalOpen(false);
	}

	function handleCriteriaChange(criteria: BulkAddCriteria[]) {
		dispatch(buildCriteriaMatch(criteria));
	}

	function handleClose() {
		setModalOpen(false);
		onClose();
	}

	if (!catalog) {
		return null;
	}

	return (
		<BulkAddModal
			isOpen={modalOpen}
			destination={destination}
			catalog={catalog}
			criteriaMatch={criteriaMatch}
			onCriteriaChange={handleCriteriaChange}
			onRequestClose={handleClose}
			onApply={handleApply}
			onCancel={() => {
				dispatch(resetCriteriaMatch());
				handleClose();
			}}
		/>
	);
}

export { ConnectedBulkAddModal };
