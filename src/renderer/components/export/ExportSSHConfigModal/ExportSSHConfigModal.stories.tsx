import React from 'react';
import { Meta } from '@storybook/react';
import { ExportSSHConfigModal } from './ExportSSHConfigModal';

const meta: Meta = {
	title: 'ExportSSHConfigModal',
	component: ExportSSHConfigModal,
};

export default meta;

export const Basic = () => {
	return (
		<ExportSSHConfigModal
			isOpen
			onRequestClose={() => {}}
			onExport={() => {}}
		/>
	);
};
