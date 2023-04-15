import { Settings, SettingsValue } from 'src/main/settings/types';
import { Catalog, UpdateCallback } from 'src/main/catalog/types';
import { FileClientConnectConfig } from 'src/main/export/types';
import { Plan } from 'src/main/plan/types';

export interface RPCRenderer {
	getVersion(): Promise<string>;
	getAllSettings(): Promise<Settings>;
	setAllSettings(settings: Settings): Promise<void>;
	getSetting(key: keyof Settings): Promise<SettingsValue>;
	setSetting(key: keyof Settings, value: SettingsValue): Promise<SettingsValue>;
	getCurrentCatalog(): Promise<Catalog | null>;
	updateCatalog(statusCallback: UpdateCallback): Promise<void>;
	cancelUpdateCatalog(): Promise<void>;
	noPlan(callback: () => void): Promise<void>;
	newPlan(): Promise<Plan>;
	savePlanAs(plan: Plan): Promise<boolean>;
	savePlan(plan: Plan): Promise<boolean>;
	exportToDirectory(plan: Plan, statusCallback: UpdateCallback): Promise<void>;
	exportToMister(
		plan: Plan,
		config: FileClientConnectConfig,
		statusCallback: UpdateCallback
	): Promise<void>;
	cancelExport(): Promise<void>;
	menu_undo(callback: () => void): Promise<void>;
	menu_redo(callback: () => void): Promise<void>;
	menu_kickOffCatalogUpdate(callback: () => void): Promise<void>;
	menu_loadDemoPlan(callback: () => void): Promise<void>;
	menu_loadNewPlan(callback: () => void): Promise<void>;
	menu_loadOpenedPlan(callback: (plan: Plan) => void): Promise<void>;
	menu_savePlanAs(callback: () => void): Promise<void>;
	menu_savePlan(callback: () => void): Promise<void>;
	menu_exportToDirectory(callback: () => void): Promise<void>;
	menu_exportToMister(callback: () => void): Promise<void>;
	menu_settings(callback: () => void): Promise<void>;
}

export interface RPCMain {
	handleGetVersion(): Promise<string>;
}
