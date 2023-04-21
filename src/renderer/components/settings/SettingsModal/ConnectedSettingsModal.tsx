import React, { useEffect, useState } from 'react';
import { Settings } from '../../../../main/settings/types';
import { SettingsModal } from './SettingsModal';
import { useSelector } from 'react-redux';
import { getAllSettings, setAllSettings } from '../settingsSlice';
import { AppState, dispatch } from '../../../store';

type ConnectedSettingsModalProps = {
	isOpen?: boolean;
};

function ConnectedSettingsModal({ isOpen }: ConnectedSettingsModalProps) {
	const [modalOpen, setModalOpen] = useState(isOpen ?? false);

	const settings = useSelector((state: AppState) => {
		return state.settings.settings;
	});

	useEffect(() => {
		dispatch(getAllSettings());

		window.ipcAPI?.menu_settings(() => {
			setModalOpen(true);
		});
	}, []);

	async function handleSettingsChange(newSettings: Settings) {
		dispatch(setAllSettings(newSettings));
	}

	if (!settings) {
		return null;
	}

	return (
		<SettingsModal
			isOpen={modalOpen}
			onRequestClose={() => {
				setModalOpen(false);
			}}
			settings={settings}
			onSettingsChange={handleSettingsChange}
		/>
	);
}

export { ConnectedSettingsModal };
