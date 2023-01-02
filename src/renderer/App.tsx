import React from 'react';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Catalog } from './components/catalog/Catalog';
import { EntryDetailModal } from './components/catalog/EntryDetailModal';
import { ExportModal } from './components/export/ExportModal';
import { ExportSambaConfigModal } from './components/export/ExportSambaConfigModal';
import { Footer } from './components/Footer';
import { Plan } from './components/plan/Plan';
import { Welcome } from './components/Welcome';
import { UpdateModal } from './components/update/UpdateModal';
import { store } from './store';

function App(): JSX.Element {
	return (
		<DndProvider backend={HTML5Backend}>
			<Provider store={store}>
				<div
					className="grid grid-cols-3 h-screen"
					style={{ gridTemplateRows: '1fr max-content' }}
				>
					<div className="flex flex-col gap-y-2 h-full overflow-auto">
						<Catalog />
					</div>
					<div className="col-span-2 h-full overflow-auto">
						<Welcome className="mx-6 my-10" />
						<Plan />
					</div>
					<Footer className="col-span-3" />
				</div>
				<UpdateModal />
				<ExportModal />
				<ExportSambaConfigModal />
				<EntryDetailModal />
			</Provider>
		</DndProvider>
	);
}

export default App;
