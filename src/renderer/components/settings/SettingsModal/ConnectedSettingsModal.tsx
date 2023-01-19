import React, { useEffect, useState } from 'react';
import { Settings } from '../../../../main/settings/types';
import { SettingsModal } from './SettingsModal';
import { useSelector } from 'react-redux';
import { getAllSettings, setAllSettings } from '../settingsSlice';
import { AppState, dispatch } from '../../../store';

function ConnectedSettingsModal() {
	const [modalOpen, setModalOpen] = useState(false);

	const settings = useSelector((state: AppState) => {
		return state.settings.settings;
	});

	useEffect(() => {
		dispatch(getAllSettings());

		window.ipcAPI.menu_settings(() => {
			setModalOpen(true);
		});
	}, []);

	async function handleOk(newSettings: Settings) {
		dispatch(setAllSettings(newSettings));
		setModalOpen(false);
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
			onOk={handleOk}
		/>
	);
}

export { ConnectedSettingsModal };
