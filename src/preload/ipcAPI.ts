import { ipcRenderer } from 'electron';
import { UpdateCallback } from 'src/main/db/types';

const ipcAPI = {
	/** Notify main the renderer is ready. */
	rendererReady() {
		ipcRenderer.send('renderer-ready');
	},
	updateCatalog(statusCallback: UpdateCallback) {
		const onUpdateStatus = (_event: Electron.IpcRendererEvent, status: any) => {
			statusCallback(status);
			if (status.done) {
				ipcRenderer.removeListener('db:updateCatalog-status', onUpdateStatus);
			}
		};
		ipcRenderer.on('db:updateCatalog-status', onUpdateStatus);

		ipcRenderer.send('db:updateCatalog');
	},

	kickOffCatalogUpdate(callback: () => void) {
		ipcRenderer.on('kickOffCatalogUpdate', callback);
	},
};

export { ipcAPI };
