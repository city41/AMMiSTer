import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Catalog } from './components/catalog/Catalog';
import { EntryDetailModal } from './components/catalog/EntryDetailModal';
import { MissingEntryModal } from './components/plan/MissingEntryModal';
import { ExportModal } from './components/export/ExportModal';
import { ExportRemoteConfigModal } from './components/export/ExportRemoteConfigModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { Footer } from './components/Footer';
import { Plan } from './components/plan/Plan';
import { Welcome } from './components/Welcome';
import { UpdateModal } from './components/update/UpdateModal';
import { store } from './store';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RPC } from './RPC';

function App() {
	window.rpc = new RPC();

	useEffect(() => {
		window.ipcAPI.onRpcPort((port: number) => {
			window.rpc?.open(port);
		});
		window.rpc?.open(9999);

		return () => window.rpc?.close();
	}, []);

	return (
		<ErrorBoundary>
			<DndProvider backend={HTML5Backend}>
				<Provider store={store}>
					<div
						className="grid grid-cols-4 h-screen"
						style={{ gridTemplateRows: '1fr max-content' }}
					>
						<div className="flex flex-col gap-y-2 h-full overflow-auto">
							<Catalog />
						</div>
						<div
							className="col-span-3 h-full overflow-auto grid"
							style={{ gridTemplateRows: 'max-content 1fr' }}
						>
							<Welcome className="mx-auto mt-10" />
							<Plan />
						</div>
						<Footer className="col-span-4" />
					</div>
					<UpdateModal />
					<ExportModal />
					<ExportRemoteConfigModal />
					<EntryDetailModal />
					<MissingEntryModal />
					<SettingsModal />
				</Provider>
			</DndProvider>
		</ErrorBoundary>
	);
}

export { App };
