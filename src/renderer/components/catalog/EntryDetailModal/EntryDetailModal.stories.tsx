import React from 'react';
import { Meta } from '@storybook/react';
import { EntryDetailModal } from './EntryDetailModal';
import type { CatalogEntry as CatalogEntryType } from '../../../../main/catalog/types';
import { mockCatalogEntry } from '../mockCatalogEntry';

const meta: Meta = {
	title: 'EntryDetailModal',
	component: EntryDetailModal,
};

export default meta;

const completeEntry = mockCatalogEntry;

export const Basic = () => {
	return <EntryDetailModal isOpen entry={completeEntry} />;
};

export const MissingCategories = () => {
	const entry = {
		...completeEntry,
		categories: [],
	};

	entry.files.roms[0].md5 = undefined;

	return <EntryDetailModal isOpen entry={entry} />;
};

export const MultipleCategories = () => {
	const entry = {
		...completeEntry,
		categories: ['aaa', 'bbb', 'ccc'],
	};

	entry.files.roms[0].md5 = undefined;

	return <EntryDetailModal isOpen entry={entry} />;
};

export const MultipleSeries = () => {
	const entry = {
		...completeEntry,
		series: ['Street Fighter', 'Marvel'],
	};

	entry.files.roms[0].md5 = undefined;

	return <EntryDetailModal isOpen entry={entry} />;
};

export const MissingRom = () => {
	const entry = {
		...completeEntry,
		files: {
			...completeEntry.files,
		},
	};

	entry.files.roms[0].md5 = undefined;

	return <EntryDetailModal isOpen entry={entry} />;
};

export const MissingRomAndCore = () => {
	const entry = {
		...completeEntry,
		files: {
			...completeEntry.files,
		},
	};

	entry.files.roms[0].md5 = undefined;
	delete entry.files.rbf;

	return <EntryDetailModal isOpen entry={entry} />;
};

export const MissingScreenshots = () => {
	const entry: CatalogEntryType = {
		...completeEntry,
		titleScreenshotUrl: null,
		gameplayScreenshotUrl: null,
	};

	return <EntryDetailModal isOpen entry={entry} />;
};

export const OneButton = () => {
	const entry: CatalogEntryType = {
		...completeEntry,
		num_buttons: 1,
	};

	return <EntryDetailModal isOpen entry={entry} />;
};

export const MissingMoveInput = () => {
	const entry: CatalogEntryType = {
		...completeEntry,
		move_inputs: [],
	};

	return <EntryDetailModal isOpen entry={entry} />;
};

export const SpecialControls = () => {
	const entry: CatalogEntryType = {
		...completeEntry,
		special_controls: ['trackball'],
	};

	return <EntryDetailModal isOpen entry={entry} />;
};

export const SpecialControlsOnly = () => {
	const entry: CatalogEntryType = {
		...completeEntry,
		special_controls: ['trackball'],
		num_buttons: null,
		move_inputs: [],
	};

	return <EntryDetailModal isOpen entry={entry} />;
};

export const MissingResolution = () => {
	const entry: CatalogEntryType = {
		...completeEntry,
		resolution: null,
	};

	return <EntryDetailModal isOpen entry={entry} />;
};

export const MissingRotation = () => {
	const entry: CatalogEntryType = {
		...completeEntry,
		rotation: null,
	};

	return <EntryDetailModal isOpen entry={entry} />;
};

export const Rotation90 = () => {
	const entry: CatalogEntryType = {
		...completeEntry,
		rotation: 90,
	};

	return <EntryDetailModal isOpen entry={entry} />;
};

export const Rotation270 = () => {
	const entry: CatalogEntryType = {
		...completeEntry,
		rotation: 270,
	};

	return <EntryDetailModal isOpen entry={entry} />;
};

export const Rotation270Flippable = () => {
	const entry: CatalogEntryType = {
		...completeEntry,
		rotation: 270,
		flip: true,
	};

	return <EntryDetailModal isOpen entry={entry} />;
};
