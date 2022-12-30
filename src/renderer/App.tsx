import React from 'react';
import { Provider } from 'react-redux';
import { Catalog } from './components/catalog/Catalog';
import { EntryDetailModal } from './components/catalog/EntryDetailModal';
import { Footer } from './components/Footer';
import { Plan } from './components/plan/Plan';
import { UpdateModal } from './components/update/UpdateModal';
import { store } from './store';

function App(): JSX.Element {
	return (
		<Provider store={store}>
			<div
				className="grid grid-cols-3 h-screen"
				style={{ gridTemplateRows: '1fr max-content' }}
			>
				<div className="flex flex-col gap-y-2 h-full overflow-auto">
					<Catalog />
				</div>
				<div className="col-span-2 h-full overflow-auto">
					<Plan />
				</div>
				<Footer className="col-span-3" />
			</div>
			<UpdateModal />
			<EntryDetailModal />
		</Provider>
	);
}

export default App;
