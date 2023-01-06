import React, { useCallback, useEffect, useState } from 'react';
import { BulkAddModal } from './BulkAddModal';
import { store, dispatch, AppState } from '../../../store';
import { BulkAddCriteria, bulkAdd } from '../planSlice';
import { useSelector } from 'react-redux';
import {
	PlanGameDirectory,
	PlanGameDirectoryEntry,
} from '../../../../main/plan/types';

function ConnectedBulkAddModal() {
	const [modalOpen, setModalOpen] = useState(false);
	const [destinationExists, setDestinationExists] = useState(true);

	const plan = useSelector((state: AppState) => {
		return state.plan.plan;
	});

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

	const handleDestinationChange = useCallback(
		(dest: string) => {
			if (plan) {
				const segments = dest
					.trim()
					.split('/')
					.map((seg) => seg.trim())
					.filter((seg) => !!seg);

				let planDir: PlanGameDirectory = plan.games;

				for (const segment of segments) {
					const entry = planDir.find((g) => {
						if ('directoryName' in g) {
							return g.directoryName === segment;
						} else {
							return false;
						}
					});

					if (!entry) {
						setDestinationExists(false);
						return;
					} else {
						planDir = (entry as PlanGameDirectoryEntry).games;
					}
				}

				setDestinationExists(true);
			}
		},
		[plan, setDestinationExists]
	);

	return (
		<BulkAddModal
			isOpen={modalOpen}
			onRequestClose={() => setModalOpen(false)}
			onApply={handleApply}
			destinationExists={destinationExists}
			onDestinationChange={handleDestinationChange}
		/>
	);
}

export { ConnectedBulkAddModal };
