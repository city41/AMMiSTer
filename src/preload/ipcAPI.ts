import { ipcRenderer } from 'electron';
import { Settings, SettingsValue } from 'src/main/settings/types';
import { Catalog, UpdateCallback, UpdateStatus } from 'src/main/catalog/types';
import { ExportStatus, FileClientConnectConfig } from 'src/main/export/types';
import { Plan } from 'src/main/plan/types';

const ipcAPI = {
	onRpcPort(callback: (port: number) => void) {
		ipcRenderer.on('rpc:port', (_event, port: number) => callback(port));
	},

	getAllSettings(): Promise<Settings> {
		return ipcRenderer.invoke('settings:getAllSettings');
	},

	setAllSettings(settings: Settings): Promise<void> {
		return ipcRenderer.invoke('settings:setAllSettings', settings);
	},

	getSetting(key: keyof Settings): Promise<SettingsValue> {
		return ipcRenderer.invoke('settings:getSetting', key);
	},

	setSetting(
		key: keyof Settings,
		value: SettingsValue
	): Promise<SettingsValue> {
		return ipcRenderer.invoke('settings:setSetting', key, value);
	},

	getCurrentCatalog(): Promise<Catalog | null> {
		return ipcRenderer.invoke('catalog:getCurrentCatalog');
	},

	updateCatalog(statusCallback: UpdateCallback) {
		const onUpdateStatus = (
			_event: Electron.IpcRendererEvent,
			status: UpdateStatus
		) => {
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

	cancelUpdateCatalog() {
		return ipcRenderer.invoke('catalog:cancelUpdateCatalog');
	},

	noPlan(callback: () => void) {
		ipcRenderer.on('plan:noPlan', callback);
	},

	newPlan(): Promise<Plan> {
		return ipcRenderer.invoke('plan:newPlan');
	},

	savePlanAs(
		plan: Plan
	): Promise<{ wasSaved: boolean; planPath: string | null }> {
		return ipcRenderer.invoke('plan:savePlanAs', plan);
	},

	savePlan(
		plan: Plan
	): Promise<{ wasSaved: boolean; planPath: string | null }> {
		return ipcRenderer.invoke('plan:savePlan', plan);
	},

	exportToDirectory(plan: Plan, statusCallback: UpdateCallback) {
		const onUpdateStatus = (
			_event: Electron.IpcRendererEvent,
			status: ExportStatus
		) => {
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
		const onUpdateStatus = (
			_event: Electron.IpcRendererEvent,
			status: ExportStatus
		) => {
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

	cancelExport() {
		return ipcRenderer.invoke('export:cancelExport');
	},

	menu_undo(callback: () => void) {
		ipcRenderer.on('menu:undo', callback);
	},

	menu_redo(callback: () => void) {
		ipcRenderer.on('menu:redo', callback);
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

	menu_loadOpenedPlan(
		callback: (args: { plan: Plan; planPath: string }) => void
	) {
		ipcRenderer.on('menu:loadOpenedPlan', (_event, args) => {
			callback(args);
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

	menu_settings(callback: () => void) {
		ipcRenderer.on('menu:settings', callback);
	},

	menu_notAPlan(callback: () => void) {
		ipcRenderer.on('menu:notAPlan', callback);
	},
};

export { ipcAPI };
