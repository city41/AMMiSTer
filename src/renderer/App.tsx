import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MisterArcadeGames } from './components/mister/MisterArcadeGames';
import { store } from './store';

function App(): JSX.Element {
	useEffect(() => {
		window.ipcAPI?.rendererReady();
	}, []);

	return (
		<Provider store={store}>
			<div className="app">
				<MisterArcadeGames />
			</div>
		</Provider>
	);
}

export default App;
