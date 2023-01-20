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

export const ConnectFailError = () => {
	return (
		<ExportModal
			isOpen
			exportType="mister"
			message=""
			error={{ type: 'connect-fail' }}
			onClose={() => {}}
		/>
	);
};

export const UnknownError = () => {
	return (
		<ExportModal
			isOpen
			exportType="mister"
			message=""
			error={{ type: 'unknown', message: `Can't call foo of undefined` }}
			onClose={() => {}}
		/>
	);
};

export const FileCopyError = () => {
	return (
		<ExportModal
			isOpen
			exportType="mister"
			message=""
			error={{
				type: 'file-error',
				fileOp: { action: 'copy', srcPath: '', destPath: 'games/mame/foo.zip' },
			}}
			onClose={() => {}}
		/>
	);
};

export const FileDeleteError = () => {
	return (
		<ExportModal
			isOpen
			exportType="mister"
			message=""
			error={{
				type: 'file-error',
				fileOp: { action: 'delete', destPath: 'games/mame/foo.zip' },
			}}
			onClose={() => {}}
		/>
	);
};

export const NetworkError = () => {
	return (
		<ExportModal
			isOpen
			exportType="mister"
			message=""
			error={{
				type: 'network-error',
				message: 'error http://foo/foo.zip certificate is not valid',
			}}
			onClose={() => {}}
		/>
	);
};
