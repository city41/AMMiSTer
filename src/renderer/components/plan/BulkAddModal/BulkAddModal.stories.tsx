import React from 'react';
import { Meta } from '@storybook/react';
import { BulkAddModal } from './BulkAddModal';

const meta: Meta = {
	title: 'BulkAddModal',
	component: BulkAddModal,
};

export default meta;

export const Basic = () => {
	return <BulkAddModal isOpen destination="" onApply={() => {}} />;
};

export const InSubDirectory = () => {
	return (
		<BulkAddModal
			isOpen
			destination="Capcom/games/fighters"
			onApply={() => {}}
		/>
	);
};
