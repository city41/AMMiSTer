import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { updateCatalog } from '../../catalog/catalogSlice';
import { AppState, dispatch } from '../../../store';

import { UpdateModal } from './UpdateModal';

function ConnectedUpdateModal() {
	const [modalClosed, setModalClosed] = useState(false);

	const { message, fresh, complete, error, duration } = useSelector(
		(state: AppState) =>
			state.catalog.updateCatalogStatus ?? {
				message: '',
				fresh: undefined,
				complete: undefined,
				error: undefined,
				duration: undefined,
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

	return (
		<UpdateModal
			isOpen={typeof complete === 'boolean' && !modalClosed}
			message={message}
			fresh={fresh}
			updates={updates}
			error={error}
			duration={duration}
			onClose={() => setModalClosed(true)}
		/>
	);
}

export { ConnectedUpdateModal };
