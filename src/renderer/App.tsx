import React, { useEffect } from 'react';

function App(): JSX.Element {
	useEffect(() => {
		window.ipcAPI?.rendererReady();
	}, []);

	return (
		<div className="app">
			<h1 className="text-4xl">AMMiSTer</h1>
		</div>
	);
}

export default App;
