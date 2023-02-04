import React from 'react';
import { Meta } from '@storybook/react';
import { CatalogLoading } from './CatalogLoading';

const meta: Meta = {
	title: 'CatalogLoading',
	component: CatalogLoading,
};

export default meta;

export const Basic = () => {
	return <CatalogLoading />;
};
