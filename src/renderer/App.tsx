import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { HomeDir } from './components/homeDir/HomeDir';
import { store } from './store';

function App(): JSX.Element {
	useEffect(() => {
		window.ipcAPI?.rendererReady();
	}, []);

	return (
		<Provider store={store}>
			<div className="app">
				<HomeDir />
			</div>
		</Provider>
	);
}

export default App;
