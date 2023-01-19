import React from 'react';
import { Meta } from '@storybook/react';
import { SettingsModal } from './SettingsModal';
import { Settings } from '../../../../main/settings/types';

const meta: Meta = {
	title: 'SettingsModal',
	component: SettingsModal,
};

export default meta;

const mockSettings: Settings = {
	'welcome-dismissed': true,
	downloadRoms: true,
	rootDir: '',
};

export const Basic = () => {
	return <SettingsModal isOpen settings={mockSettings} onOk={() => {}} />;
};
