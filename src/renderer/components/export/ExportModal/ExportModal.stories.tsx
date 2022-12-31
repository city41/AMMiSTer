import React from 'react';
import { Meta } from '@storybook/react';
import { ExportModal } from './ExportModal';

const meta: Meta = {
	title: 'ExportModal',
	component: ExportModal,
};

export default meta;

export const ToDirectory = () => {
	return (
		<ExportModal
			isOpen
			exportType="directory"
			message="And he likes to shoot his gun"
			onClose={() => {}}
		/>
	);
};

export const ToMister = () => {
	return (
		<ExportModal
			isOpen
			exportType="mister"
			message="And he likes to shoot his gun"
			onClose={() => {}}
		/>
	);
};
