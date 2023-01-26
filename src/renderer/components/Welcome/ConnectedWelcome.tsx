import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getAllSettings, setSetting } from '../settings/settingsSlice';
import { AppState, dispatch } from '../../store';
import { Welcome, PublicWelcomeProps } from './Welcome';

function ConnectedWelcome(props: PublicWelcomeProps) {
	useEffect(() => {
		dispatch(getAllSettings());
	}, []);

	const settings = useSelector((state: AppState) => {
		return state.settings.settings;
	});

	function handleDismiss() {
		dispatch(setSetting('welcome-dismissed', true));
	}

	if (settings && !settings['welcome-dismissed']) {
		return <Welcome {...props} onDismiss={handleDismiss} />;
	} else {
		return null;
	}
}

export { ConnectedWelcome };
