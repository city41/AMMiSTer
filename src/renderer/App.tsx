import React from 'react';
import { Provider } from 'react-redux';
import { Catalog } from './components/catalog/Catalog';
import { EntryDetailModal } from './components/catalog/EntryDetailModal';
import { Plan } from './components/plan/Plan';
import { UpdateModal } from './components/update/UpdateModal';
import { store } from './store';

function App(): JSX.Element {
	return (
		<Provider store={store}>
			<div className="grid grid-cols-3 h-screen">
				<div className="col-span-2 h-full overflow-auto">
					<Plan />
				</div>
				<div className="flex flex-col gap-y-2 h-full overflow-auto">
					<Catalog />
				</div>
			</div>
			<UpdateModal />
			<EntryDetailModal />
		</Provider>
	);
}

export default App;
