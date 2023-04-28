import React from 'react';
import { Meta } from '@storybook/react';
import { UpdateModal } from './UpdateModal';
import type { Update } from '../../../../main/catalog/types';

const meta: Meta = {
	title: 'UpdateModal',
	component: UpdateModal,
};

export default meta;

const update1: Update = {
	updateReason: 'missing',
	fileEntry: {
		type: 'mra',
		db_id: 'jtcores',
		fileName: 'Street Fighter Alpha 2 (Euro 960229).mra',
		md5: 'dummy hash',
		dbRelFilePath: '_Arcade/Street Fighter 2 (Euro 960229).mra',
		relFilePath: '_Arcade/Street Fighter 2 (Euro 960229).mra',
		remoteUrl: 'https://example.com',
		size: 456,
	},
};

const update2: Update = {
	updateReason: 'missing',
	fileEntry: {
		type: 'rom',
		db_id: 'jtcores',
		fileName: 'sfa2.zip',
		relFilePath: 'games/mame/sfa2.zip',
		remoteUrl: 'https://example.com',
		size: 456,
	},
};

export const Checking = () => {
	return (
		<UpdateModal
			isOpen
			message="Getting latest for MiSTer main"
			onClose={() => {}}
			onCancelClick={() => {}}
		/>
	);
};

export const Canceled = () => {
	return (
		<UpdateModal
			isOpen
			message="Update canceled"
			onClose={() => {}}
			onCancelClick={() => {}}
			canceled
		/>
	);
};

export const NoUpdates = () => {
	return (
		<UpdateModal
			isOpen
			updates={[]}
			onClose={() => {}}
			duration={12345}
			onCancelClick={() => {}}
		/>
	);
};

export const Updates = () => {
	return (
		<UpdateModal
			isOpen
			updates={[update1, update2]}
			onClose={() => {}}
			duration={23456}
			onCancelClick={() => {}}
		/>
	);
};

export const IsFreshUpdate = () => {
	return (
		<UpdateModal
			isOpen
			updates={null}
			fresh
			message="Downloading foo.zip"
			onClose={() => {}}
			onCancelClick={() => {}}
		/>
	);
};

export const LotsOfUpdates = () => {
	const updates = [];
	for (let i = 0; i < 200; ++i) {
		updates.push(update1);
		updates.push(update2);
	}

	return (
		<UpdateModal
			isOpen
			updates={updates}
			onClose={() => {}}
			duration={456798}
			onCancelClick={() => {}}
		/>
	);
};

export const SomeUpdatesErrored = () => {
	const updates = [];
	for (let i = 0; i < 10; ++i) {
		if (i % 4 === 0) {
			updates.push({
				...update1,
				error: true,
				errorMessage: 'something bad happened here',
			});
		} else {
			updates.push(update1);
		}
	}

	return (
		<UpdateModal
			isOpen
			updates={updates}
			onClose={() => {}}
			duration={456798}
			onCancelClick={() => {}}
		/>
	);
};

export const UnknownError = () => {
	return (
		<UpdateModal
			isOpen
			updates={null}
			error={{ type: 'unknown', message: `Can't call foo of undefined` }}
			onClose={() => {}}
			onCancelClick={() => {}}
		/>
	);
};

export const ConnectError = () => {
	return (
		<UpdateModal
			isOpen
			updates={null}
			error={{ type: 'connect-fail' }}
			onClose={() => {}}
			onCancelClick={() => {}}
		/>
	);
};

export const FileError = () => {
	return (
		<UpdateModal
			isOpen
			updates={null}
			error={{
				type: 'file-error',
				fileEntry: {
					fileName: 'foo.rbf',
					db_id: 'jtcores',
					dbRelFilePath: '_Arcade/cores/foo.rbf',
					relFilePath: '_Arcade/cores/foo.rbf',
					type: 'rbf',
					remoteUrl: '',
					md5: 'mock-hash',
					size: 456,
				},
			}}
			onClose={() => {}}
			onCancelClick={() => {}}
		/>
	);
};

export const NetworkError = () => {
	return (
		<UpdateModal
			isOpen
			updates={null}
			error={{
				message: 'error http://foo/foo.zip certificate is not valid',
				type: 'network-error',
			}}
			onClose={() => {}}
			onCancelClick={() => {}}
		/>
	);
};
