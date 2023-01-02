import React, { useEffect, useState } from 'react';
import { Welcome, PublicWelcomeProps } from './Welcome';

function ConnectedWelcome(props: PublicWelcomeProps) {
	const [showWelcome, setShowWelcome] = useState(false);

	useEffect(() => {
		window.ipcAPI.getWelcomeDismissed().then((welcomeDismissed) => {
			setShowWelcome(!welcomeDismissed);
		});
	}, [setShowWelcome]);

	function handleDismiss() {
		window.ipcAPI.setWelcomeDismissed();
		setShowWelcome(false);
	}

	if (showWelcome) {
		return <Welcome {...props} onDismiss={handleDismiss} />;
	} else {
		return null;
	}
}

export { ConnectedWelcome };
