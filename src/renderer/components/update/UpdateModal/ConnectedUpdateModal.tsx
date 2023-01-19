import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { updateCatalog } from '../../catalog/catalogSlice';
import { AppState, dispatch } from '../../../store';

import { UpdateModal } from './UpdateModal';

function ConnectedUpdateModal() {
	const [modalClosed, setModalClosed] = useState(false);

	const { message, fresh, complete, error, duration, canceled } = useSelector(
		(state: AppState) =>
			state.catalog.updateCatalogStatus ?? {
				message: '',
				fresh: undefined,
				complete: undefined,
				error: undefined,
				duration: undefined,
				canceled: undefined,
			}
	);

	const updates = useSelector((state: AppState) => state.catalog.updates);

	useEffect(() => {
		window.ipcAPI.menu_kickOffCatalogUpdate(() => {
			dispatch(updateCatalog());
		});
	}, []);

	useEffect(() => {
		if (typeof complete === 'boolean') {
			setModalClosed(false);
		}
	}, [complete]);

	function handleCancelClick() {
		window.ipcAPI.cancelUpdateCatalog();
	}

	return (
		<UpdateModal
			isOpen={typeof complete === 'boolean' && !modalClosed}
			message={message}
			fresh={fresh}
			updates={updates}
			error={error}
			duration={duration}
			canceled={canceled}
			onClose={() => setModalClosed(true)}
			onCancelClick={handleCancelClick}
		/>
	);
}

export { ConnectedUpdateModal };
