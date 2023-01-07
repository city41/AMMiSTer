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
	const [newPath, setNewPath] = useState('');

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

				for (let i = 0; i < segments.length; ++i) {
					const segment = segments[i];
					const entry = planDir.find((g) => {
						if ('directoryName' in g) {
							return g.directoryName.toLowerCase() === segment.toLowerCase();
						} else {
							return false;
						}
					});

					if (!entry) {
						setNewPath(segments.slice(i).join('/'));
						return;
					} else {
						planDir = (entry as PlanGameDirectoryEntry).games;
					}
				}

				setNewPath('');
			}
		},
		[plan, setNewPath]
	);

	return (
		<BulkAddModal
			isOpen={modalOpen}
			onRequestClose={() => setModalOpen(false)}
			onApply={handleApply}
			newPath={newPath}
			onDestinationChange={handleDestinationChange}
		/>
	);
}

export { ConnectedBulkAddModal };
