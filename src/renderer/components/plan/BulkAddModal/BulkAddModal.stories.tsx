import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Meta } from '@storybook/react';
import { BulkAddModal } from './BulkAddModal';
import { mockCatalogEntry } from '../../catalog/mockCatalogEntry';
import { Catalog } from '../../../../main/catalog/types';
import { Provider } from 'react-redux';
import { store } from '../../../store';

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
			criteriaMatch={null}
			onCriteriaChange={() => {}}
			onApply={() => {}}
			onCancel={() => {}}
			catalog={mockCatalog}
			allGamesInPlan={[]}
		/>
	);
};

export const InSubDirectory = () => {
	return (
		<BulkAddModal
			isOpen
			destination="Capcom/games/fighters"
			criteriaMatch={null}
			onCriteriaChange={() => {}}
			onApply={() => {}}
			onCancel={() => {}}
			catalog={mockCatalog}
			allGamesInPlan={[]}
		/>
	);
};

export const HasMatches = () => {
	return (
		<DndProvider backend={HTML5Backend}>
			<Provider store={store}>
				<BulkAddModal
					isOpen
					destination="Capcom/games/fighters"
					criteriaMatch={[mockCatalogEntry, mockCatalogEntry]}
					onCriteriaChange={() => {}}
					onApply={() => {}}
					onCancel={() => {}}
					catalog={mockCatalog}
					allGamesInPlan={[]}
				/>
			</Provider>
		</DndProvider>
	);
};

export const NothingMatched = () => {
	return (
		<BulkAddModal
			isOpen
			destination="Capcom/games/fighters"
			criteriaMatch={[]}
			onCriteriaChange={() => {}}
			onApply={() => {}}
			onCancel={() => {}}
			catalog={mockCatalog}
			allGamesInPlan={[]}
		/>
	);
};
