import React from 'react';
import { Meta } from '@storybook/react';
import { BulkAddModal } from './BulkAddModal';

const meta: Meta = {
	title: 'BulkAddModal',
	component: BulkAddModal,
};

export default meta;

export const NoNewPath = () => {
	return (
		<BulkAddModal
			isOpen
			onApply={() => {}}
			onDestinationChange={() => {}}
			newPath=""
		/>
	);
};

export const NewPath = () => {
	return (
		<BulkAddModal
			isOpen
			onApply={() => {}}
			onDestinationChange={() => {}}
			newPath="fighters/capcom"
		/>
	);
};
