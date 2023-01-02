import React from 'react';
import { Meta } from '@storybook/react';
import { ExportSambaConfigModal } from './ExportSambaConfigModal';

const meta: Meta = {
	title: 'ExportSambaConfigModal',
	component: ExportSambaConfigModal,
};

export default meta;

export const Basic = () => {
	return (
		<ExportSambaConfigModal
			isOpen
			onRequestClose={() => {}}
			onExport={() => {}}
		/>
	);
};
