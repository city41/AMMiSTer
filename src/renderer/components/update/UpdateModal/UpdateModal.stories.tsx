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
		relFilePath: '_Arcade/Street Fighter 2 (Euro 960229).mra',
		remoteUrl: 'https://example.com',
	},
};

const update2: Update = {
	updateReason: 'missing',
	fileEntry: {
		type: 'rom',
		db_id: 'jtcores',
		fileName: 'sfa2.zip',
		md5: 'dummy hash',
		relFilePath: 'games/mame/sfa2.zip',
		remoteUrl: 'https://example.com',
	},
};

export const Checking = () => {
	return (
		<UpdateModal
			isOpen
			message="Getting latest for MiSTer main"
			onClose={() => {}}
		/>
	);
};

export const NoUpdates = () => {
	return (
		<UpdateModal isOpen updates={[]} onClose={() => {}} duration={12345} />
	);
};

export const Updates = () => {
	return (
		<UpdateModal
			isOpen
			updates={[update1, update2]}
			onClose={() => {}}
			duration={23456}
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
					relFilePath: '_Arcade/cores/foo.rbf',
					type: 'rbf',
					remoteUrl: '',
				},
			}}
			onClose={() => {}}
		/>
	);
};
