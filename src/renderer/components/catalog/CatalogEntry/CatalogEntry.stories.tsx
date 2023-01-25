import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Meta } from '@storybook/react';
import { CatalogEntry } from './CatalogEntry';
import { mockCatalogEntry } from '../mockCatalogEntry';
import cloneDeep from 'lodash/cloneDeep';

const meta: Meta = {
	title: 'CatalogEntry',
	component: CatalogEntry,
};

export default meta;

const completeEntry = mockCatalogEntry;

export const CompleteEntry = () => {
	return (
		<DndProvider backend={HTML5Backend}>
			<div className="p-2 border-r border-gray-200" style={{ width: 240 }}>
				<CatalogEntry entry={completeEntry} onToggleFavorite={() => {}} />
			</div>
		</DndProvider>
	);
};

export const IsInPlan = () => {
	return (
		<DndProvider backend={HTML5Backend}>
			<div className="p-2 border-r border-gray-200" style={{ width: 240 }}>
				<CatalogEntry
					entry={completeEntry}
					isInPlan
					onToggleFavorite={() => {}}
				/>
			</div>
		</DndProvider>
	);
};

export const MissingTheRBFFile = () => {
	const entry = cloneDeep(completeEntry);
	delete entry.files.rbf;

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="p-2 border-r border-gray-200" style={{ width: 240 }}>
				<CatalogEntry entry={entry} onToggleFavorite={() => {}} />
			</div>
		</DndProvider>
	);
};

export const UnexpectedlyMissingMra = () => {
	const entry = cloneDeep(completeEntry);
	entry.files.mra.status = 'unexpected-missing';

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="p-2 border-r border-gray-200" style={{ width: 240 }}>
				<CatalogEntry entry={entry} onToggleFavorite={() => {}} />
			</div>
		</DndProvider>
	);
};

export const UnexpectedlyCorruptMra = () => {
	const entry = cloneDeep(completeEntry);
	entry.files.mra.status = 'corrupt';

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="p-2 border-r border-gray-200" style={{ width: 240 }}>
				<CatalogEntry entry={entry} onToggleFavorite={() => {}} />
			</div>
		</DndProvider>
	);
};

export const Favorited = () => {
	const entry = {
		...completeEntry,
		favorite: true,
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="p-2 border-r border-gray-200" style={{ width: 240 }}>
				<CatalogEntry
					entry={entry}
					onToggleFavorite={() => {}}
					isFavorite={true}
				/>
			</div>
		</DndProvider>
	);
};

export const NotFavorited = () => {
	const entry = {
		...completeEntry,
		favorite: false,
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="p-2 border-r border-gray-200" style={{ width: 240 }}>
				<CatalogEntry
					entry={entry}
					onToggleFavorite={() => {}}
					isFavorite={false}
				/>
			</div>
		</DndProvider>
	);
};

export const Vertical = () => {
	const entry = {
		...completeEntry,
		rotation: 90,
	} as const;

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="p-2 border-r border-gray-200" style={{ width: 240 }}>
				<CatalogEntry entry={entry} onToggleFavorite={() => {}} />
			</div>
		</DndProvider>
	);
};

export const rotationUnknown = () => {
	const entry = {
		...completeEntry,
		rotation: null,
	} as const;

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="p-2 border-r border-gray-200" style={{ width: 240 }}>
				<CatalogEntry entry={entry} onToggleFavorite={() => {}} />
			</div>
		</DndProvider>
	);
};
