import React from 'react';
import { Meta } from '@storybook/react';
import { BulkAddModal } from './BulkAddModal';
import { mockCatalogEntry } from '../../catalog/mockCatalogEntry';
import { Catalog } from '../../../../main/catalog/types';

const meta: Meta = {
	title: 'BulkAddModal',
	component: BulkAddModal,
};

export default meta;

// @ts-expect-error
const mockCatalog: Catalog = {
	updatedAt: Date.now(),
	jtcores: [mockCatalogEntry],
};

export const Basic = () => {
	return (
		<BulkAddModal
			isOpen
			destination=""
			onApply={() => {}}
			catalog={mockCatalog}
		/>
	);
};

export const InSubDirectory = () => {
	return (
		<BulkAddModal
			isOpen
			destination="Capcom/games/fighters"
			onApply={() => {}}
			catalog={mockCatalog}
		/>
	);
};
