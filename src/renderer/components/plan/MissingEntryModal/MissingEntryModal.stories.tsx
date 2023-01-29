import React from 'react';
import { Meta } from '@storybook/react';
import { UpdateDbConfig } from '../../../../main/settings/types';
import { MissingEntryModal } from './MissingEntryModal';

const meta: Meta = {
	title: 'MissingEntryModal',
	component: MissingEntryModal,
};

export default meta;

const mockMissingEntry = {
	missing: true,
	db_id: 'distribution_mister',
	relFilePath: '_Arcade/Space Invaders.mra',
} as const;

const mockUpdateDbConfig: UpdateDbConfig = {
	db_id: 'distribution_mister',
	url: '',
	displayName: 'MiSTer Main',
	enabled: false,
};

export const DisabledUpdateDB = () => {
	return (
		<MissingEntryModal
			entry={mockMissingEntry}
			updateDbConfigs={[mockUpdateDbConfig]}
			isOpen
			onRequestClose={() => {}}
		/>
	);
};

export const UnknownReason = () => {
	const mockDb = {
		...mockUpdateDbConfig,
		enabled: true,
	};

	return (
		<MissingEntryModal
			entry={mockMissingEntry}
			updateDbConfigs={[mockDb]}
			isOpen
			onRequestClose={() => {}}
		/>
	);
};
