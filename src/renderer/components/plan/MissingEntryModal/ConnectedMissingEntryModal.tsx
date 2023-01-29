import React from 'react';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../../store';
import { clearMissingDetailEntry } from '../planSlice';
import { MissingEntryModal } from './MissingEntryModal';

function ConnectedMissingEntryModal() {
	const detailEntry = useSelector((s: AppState) => {
		return s.plan.present.missingDetailEntry;
	});

	const settings = useSelector((s: AppState) => {
		return s.settings.settings;
	});

	if (detailEntry === null) {
		return null;
	}

	if (settings === null) {
		return null;
	}

	function handleClose() {
		dispatch(clearMissingDetailEntry());
	}

	return (
		<MissingEntryModal
			isOpen
			entry={detailEntry}
			updateDbConfigs={settings.updateDbs}
			onRequestClose={handleClose}
		/>
	);
}

export { ConnectedMissingEntryModal };
