import { ipcRenderer } from 'electron';
import { Catalog, UpdateCallback } from 'src/main/catalog/types';
import { Plan } from 'src/main/plan/types';

const ipcAPI = {
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

	loadDemoPlan(callback: () => void) {
		ipcRenderer.on('loadDemoPlan', callback);
	},

	loadNewPlan(callback: () => void) {
		ipcRenderer.on('loadNewPlan', callback);
	},

	loadOpenedPlan(callback: (plan: Plan) => void) {
		ipcRenderer.on('loadOpenedPlan', (_event, plan) => {
			callback(plan);
		});
	},

	newPlan(): Promise<Plan> {
		return ipcRenderer.invoke('plan:newPlan');
	},
};

export { ipcAPI };
