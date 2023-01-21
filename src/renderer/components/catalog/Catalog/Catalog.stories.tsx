import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Meta } from '@storybook/react';
import { Catalog } from './Catalog';
import type { Catalog as CatalogType } from '../../../../main/catalog/types';
import { mockCatalogEntry } from '../mockCatalogEntry';

const meta: Meta = {
	title: 'Catalog',
	component: Catalog,
};

export default meta;

// @ts-expect-error
const catalog: CatalogType = {
	updatedAt: Date.now(),
	jtcores: [mockCatalogEntry, mockCatalogEntry],
};

export const Basic = () => {
	return (
		<DndProvider backend={HTML5Backend}>
			<div style={{ width: 240 }}>
				<Catalog catalog={catalog} updateDbConfigs={[]} />
			</div>
		</DndProvider>
	);
};
