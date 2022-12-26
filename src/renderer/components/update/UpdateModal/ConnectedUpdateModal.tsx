import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../../store';

import { UpdateModal } from './UpdateModal';

function ConnectedUpdateModal() {
	const [modalClosed, setModalClosed] = useState(false);

	const { message, complete } = useSelector(
		(state: AppState) => state.db.updateCatalogStatus ?? { message: '' }
	);

	console.log({ complete });

	const updates = useSelector((state: AppState) => state.db.updates);

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
