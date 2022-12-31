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
			if (status.complete) {
				ipcRenderer.removeListener(
					'catalog:updateCatalog-status',
					onUpdateStatus
				);
			}
		};
		ipcRenderer.on('catalog:updateCatalog-status', onUpdateStatus);
		ipcRenderer.send('catalog:updateCatalog');
	},

	newPlan(): Promise<Plan> {
		return ipcRenderer.invoke('plan:newPlan');
	},

	exportToDirectory(plan: Plan, statusCallback: UpdateCallback) {
		const onUpdateStatus = (_event: Electron.IpcRendererEvent, status: any) => {
			statusCallback(status);
			if (status.complete) {
				ipcRenderer.removeListener(
					'export:exportToDirectory-status',
					onUpdateStatus
				);
			}
		};

		ipcRenderer.on('export:exportToDirectory-status', onUpdateStatus);
		ipcRenderer.send('export:exportToDirectory', plan);
	},

	menu_kickOffCatalogUpdate(callback: () => void) {
		ipcRenderer.on('menu:kickOffCatalogUpdate', callback);
	},

	menu_loadDemoPlan(callback: () => void) {
		ipcRenderer.on('menu:loadDemoPlan', callback);
	},

	menu_loadNewPlan(callback: () => void) {
		ipcRenderer.on('menu:loadNewPlan', callback);
	},

	menu_loadOpenedPlan(callback: (plan: Plan) => void) {
		ipcRenderer.on('menu:loadOpenedPlan', (_event, plan) => {
			callback(plan);
		});
	},

	menu_exportToDirectory(callback: () => void) {
		ipcRenderer.on('menu:exportToDirectory', callback);
	},
};

export { ipcAPI };
