import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { updateCatalog } from '../../catalog/catalogSlice';
import { AppState, dispatch } from '../../../store';

import { UpdateModal } from './UpdateModal';

function ConnectedUpdateModal() {
	const [modalClosed, setModalClosed] = useState(false);

	const { message, complete } = useSelector(
		(state: AppState) => state.catalog.updateCatalogStatus ?? { message: '' }
	);

	const updates = useSelector((state: AppState) => state.catalog.updates);

	useEffect(() => {
		window.ipcAPI.kickOffCatalogUpdate(() => {
			dispatch(updateCatalog());
		});
	}, []);

	useEffect(() => {
		if (typeof complete === 'boolean') {
			setModalClosed(false);
		}
	}, [complete]);

	return (
		<UpdateModal
			isOpen={typeof complete === 'boolean' && !modalClosed}
			message={message}
			updates={updates}
			onClose={() => setModalClosed(true)}
		/>
	);
}

export { ConnectedUpdateModal };
