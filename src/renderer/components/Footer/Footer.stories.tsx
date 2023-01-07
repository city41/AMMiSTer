import React from 'react';
import { Meta } from '@storybook/react';
import { Footer } from './Footer';

const meta: Meta = {
	title: 'Footer',
	component: Footer,
};

export default meta;

export const Basic = () => {
	return (
		<Footer localVersion="0.5.0" mainVersion="0.5.0" updatedAt={Date.now()} />
	);
};

export const NewVersionAvailable = () => {
	return (
		<Footer localVersion="0.5.0" mainVersion="0.6.0" updatedAt={Date.now()} />
	);
};
