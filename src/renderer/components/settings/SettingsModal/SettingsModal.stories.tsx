import React from 'react';
import { Meta } from '@storybook/react';
import { SettingsModal } from './SettingsModal';
import { Settings } from '../../../../main/settings/types';
import { defaultUpdateDbs } from '../../../../main/settings/defaultUpdateDbs';

const meta: Meta = {
	title: 'SettingsModal',
	component: SettingsModal,
};

export default meta;

const mockSettings: Settings = {
	'welcome-dismissed': true,
	downloadRoms: false,
	rootDir: '',
	recentPlans: [],
	updateDbs: defaultUpdateDbs,
	exportOptimization: 'space',
	destPathsToIgnore: [],
};

export const Basic = () => {
	return (
		<SettingsModal isOpen settings={mockSettings} onSettingsChange={() => {}} />
	);
};
