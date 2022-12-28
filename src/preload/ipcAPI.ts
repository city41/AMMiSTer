import { ipcRenderer } from 'electron';
import { Catalog, UpdateCallback } from 'src/main/catalog/types';

const ipcAPI = {
	/** Notify main the renderer is ready. */
	rendererReady() {
		ipcRenderer.send('renderer-ready');
	},

	getCurrentCatalog(): Promise<Catalog | null> {
		return ipcRenderer.invoke('catalog:getCurrentCatalog');
	},

	updateCatalog(statusCallback: UpdateCallback) {
		const onUpdateStatus = (_event: Electron.IpcRendererEvent, status: any) => {
			statusCallback(status);
			if (status.done) {
				ipcRenderer.removeListener(
					'catalog:updateCatalog-status',
					onUpdateStatus
				);
			}
		};
		ipcRenderer.on('catalog:updateCatalog-status', onUpdateStatus);

		ipcRenderer.send('catalog:updateCatalog');
	},

	kickOffCatalogUpdate(callback: () => void) {
		ipcRenderer.on('kickOffCatalogUpdate', callback);
	},
};

export { ipcAPI };
