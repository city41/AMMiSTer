import React from 'react';
import { Meta } from '@storybook/react';
import { ExportRemoteConfigModal } from './ExportRemoteConfigModal';

const meta: Meta = {
	title: 'ExportRemoteConfigModal',
	component: ExportRemoteConfigModal,
};

export default meta;

export const Basic = () => {
	return (
		<ExportRemoteConfigModal
			isOpen
			onRequestClose={() => {}}
			onExport={() => {}}
		/>
	);
};
