import React, { useMemo, useState } from 'react';
import { BulkAddModal } from './BulkAddModal';
import { dispatch, AppState } from '../../../store';
import {
	BulkAddCriteria,
	bulkAdd,
	buildCriteriaMatch,
	resetCriteriaMatch,
	getAllGamesInPlan,
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

	const plan = useSelector((state: AppState) => {
		return state.plan.present.plan;
	});

	const allGamesInPlan = useMemo(() => {
		if (!plan) {
			return [];
		} else {
			return getAllGamesInPlan(plan.games);
		}
	}, [plan]);

	const criteriaMatch = useSelector((state: AppState) => {
		return state.plan.present.criteriaMatch;
	});

	function handleApply(criteria: BulkAddCriteria[], addOnlyNew: boolean) {
		dispatch(bulkAdd({ criteria, destination, addOnlyNew }));
		setModalOpen(false);
	}

	function handleCriteriaChange(criteria: BulkAddCriteria[]) {
		dispatch(buildCriteriaMatch(criteria));
	}

	function handleClose() {
		setModalOpen(false);
		dispatch(resetCriteriaMatch());
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
			allGamesInPlan={allGamesInPlan}
			criteriaMatch={criteriaMatch}
			onCriteriaChange={handleCriteriaChange}
			onRequestClose={handleClose}
			onApply={handleApply}
			onCancel={() => {
				handleClose();
			}}
		/>
	);
}

export { ConnectedBulkAddModal };
