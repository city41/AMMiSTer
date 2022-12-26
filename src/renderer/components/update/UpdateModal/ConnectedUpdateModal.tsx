import React from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../../store';

import { UpdateModal } from './UpdateModal';

function ConnectedUpdateModal() {
	const { message, complete } = useSelector(
		(state: AppState) => state.db.updateStatus ?? { message: '' }
	);

	return (
		<>
			<UpdateModal isOpen={complete === false} message={message} />
		</>
	);
}

export { ConnectedUpdateModal };
