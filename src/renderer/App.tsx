import React from 'react';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Catalog } from './components/catalog/Catalog';
import { EntryDetailModal } from './components/catalog/EntryDetailModal';
import { ExportModal } from './components/export/ExportModal';
import { ExportRemoteConfigModal } from './components/export/ExportRemoteConfigModal';
import { Footer } from './components/Footer';
import { Plan } from './components/plan/Plan';
import { Welcome } from './components/Welcome';
import { UpdateModal } from './components/update/UpdateModal';
import { store } from './store';

function App() {
	return (
		<DndProvider backend={HTML5Backend}>
			<Provider store={store}>
				<div
					className="grid grid-cols-5 h-screen"
					style={{ gridTemplateRows: '1fr max-content' }}
				>
					<div className="flex flex-col gap-y-2 h-full overflow-auto">
						<Catalog />
					</div>
					<div
						className="col-span-4 h-full overflow-auto grid"
						style={{ gridTemplateRows: 'max-content 1fr' }}
					>
						<Welcome className="mx-auto mt-10" />
						<Plan />
					</div>
					<Footer className="col-span-5" />
				</div>
				<UpdateModal />
				<ExportModal />
				<ExportRemoteConfigModal />
				<EntryDetailModal />
			</Provider>
		</DndProvider>
	);
}

export { App };
