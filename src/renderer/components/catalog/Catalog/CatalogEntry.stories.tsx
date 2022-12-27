import React from 'react';
import { Meta } from '@storybook/react';
import { CatalogEntry } from './CatalogEntry';

const meta: Meta = {
	title: 'CatalogEntry',
	component: CatalogEntry,
};

export default meta;

export const Basic = () => {
	return <CatalogEntry />;
};
