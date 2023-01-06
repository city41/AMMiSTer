import { ipcRenderer } from 'electron';
import { Catalog, UpdateCallback } from 'src/main/catalog/types';
import { FileClientConnectConfig } from 'src/main/export/types';
import { Plan } from 'src/main/plan/types';

const ipcAPI = {
	getVersion(): Promise<string> {
		return ipcRenderer.invoke('main:getVersion');
	},

	getWelcomeDismissed(): Promise<boolean> {
		return ipcRenderer.invoke('settings:getWelcomeDismissed');
	},

	setWelcomeDismissed(): Promise<boolean> {
		return ipcRenderer.invoke('settings:setWelcomeDismissed');
	},

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

	savePlanAs(plan: Plan): Promise<void> {
		return ipcRenderer.invoke('plan:savePlanAs', plan);
	},

	savePlan(plan: Plan): Promise<void> {
		return ipcRenderer.invoke('plan:savePlan', plan);
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

	exportToMister(
		plan: Plan,
		config: FileClientConnectConfig,
		statusCallback: UpdateCallback
	) {
		const onUpdateStatus = (_event: Electron.IpcRendererEvent, status: any) => {
			statusCallback(status);
			if (status.complete) {
				ipcRenderer.removeListener(
					'export:exportToMister-status',
					onUpdateStatus
				);
			}
		};

		ipcRenderer.on('export:exportToMister-status', onUpdateStatus);
		ipcRenderer.send('export:exportToMister', plan, config);
	},

	menu_kickOffCatalogUpdate(callback: () => void) {
		ipcRenderer.on('menu:kickOffCatalogUpdate', callback);
	},

	menu_kickOffBulkAdd(callback: () => void) {
		ipcRenderer.on('menu:kickOffBulkAdd', callback);
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

	menu_savePlanAs(callback: () => void) {
		ipcRenderer.on('menu:savePlanAs', (_event) => {
			callback();
		});
	},

	menu_savePlan(callback: () => void) {
		ipcRenderer.on('menu:savePlan', (_event) => {
			callback();
		});
	},

	menu_exportToDirectory(callback: () => void) {
		ipcRenderer.on('menu:exportToDirectory', callback);
	},

	menu_exportToMister(callback: () => void) {
		ipcRenderer.on('menu:exportToMister', callback);
	},
};

export { ipcAPI };
