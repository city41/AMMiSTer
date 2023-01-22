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
			onCancelClick={() => {}}
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
			onCancelClick={() => {}}
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
			onCancelClick={() => {}}
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
			onCancelClick={() => {}}
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
			onCancelClick={() => {}}
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
			onCancelClick={() => {}}
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
			onCancelClick={() => {}}
		/>
	);
};

export const Canceled = () => {
	return (
		<ExportModal
			isOpen
			exportType="mister"
			message=""
			canceled
			onClose={() => {}}
			onCancelClick={() => {}}
		/>
	);
};
