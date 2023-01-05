import React from 'react';
import { Meta } from '@storybook/react';
import { Welcome } from './Welcome';

const meta: Meta = {
	title: 'Welcome',
	component: Welcome,
};

export default meta;

export const Basic = () => {
	return <Welcome appVersion="mock" onDismiss={() => {}} />;
};

export const AlphaWarning = () => {
	return <Welcome appVersion="0.0.0" onDismiss={() => {}} />;
};
