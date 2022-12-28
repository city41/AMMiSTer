import React from 'react';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../../store';
import { clearDetailEntry } from '../catalogSlice';
import { EntryDetailModal } from './EntryDetailModal';

function ConnectedEntryDetailModal() {
	const detailEntry = useSelector((s: AppState) => {
		return s.catalog.detailEntry;
	});

	if (detailEntry === null) {
		return null;
	}

	function handleClose() {
		dispatch(clearDetailEntry());
	}

	return (
		<EntryDetailModal isOpen entry={detailEntry} onRequestClose={handleClose} />
	);
}

export { ConnectedEntryDetailModal };
