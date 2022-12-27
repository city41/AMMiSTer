import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Catalog } from './components/catalog/Catalog';
import { UpdateModal } from './components/update/UpdateModal';
// import { MisterArcadeGames } from './components/mister/MisterArcadeGames';
import { store } from './store';

function App(): JSX.Element {
	useEffect(() => {
		window.ipcAPI?.rendererReady();
	}, []);

	return (
		<Provider store={store}>
			<div className="grid grid-cols-3">
				<div className="flex flex-col gap-y-2">
					<Catalog />
				</div>
				<div className="col-span-2">Tree</div>
			</div>
			<UpdateModal />
		</Provider>
	);
}

export default App;
