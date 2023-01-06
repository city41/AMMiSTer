import React from 'react';
import { Meta } from '@storybook/react';
import { BulkAddModal } from './BulkAddModal';

const meta: Meta = {
	title: 'BulkAddModal',
	component: BulkAddModal,
};

export default meta;

export const DestinationExists = () => {
	return (
		<BulkAddModal
			isOpen
			onApply={() => {}}
			onDestinationChange={() => {}}
			destinationExists
		/>
	);
};

export const DestinationDoesNotExist = () => {
	return (
		<BulkAddModal
			isOpen
			onApply={() => {}}
			onDestinationChange={() => {}}
			destinationExists={false}
		/>
	);
};
