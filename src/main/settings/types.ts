import electronSettings from 'electron-settings';

/**
 * Changes to all the types in here should be additive, and it is important that
 * settings#init() ensures the user is up to date on all settings values.
 */

export type SettingsValue = ReturnType<typeof electronSettings.getSync>;

export type UpdateDbConfig = {
	db_id: string;
	displayName: string;
	url: string;
	enabled: boolean;
	isDependent?: boolean;
};

/**
 * speed -> copy all rbfs and roms in the catalog. First update will take a long time, but then subsequent updates will be fast
 * space -> only export what is needed, deleting extraneous rbfs and roms
 */
export type ExportOptimization = 'speed' | 'space';

export type Settings = {
	rootDir: string;
	downloadRoms: boolean;
	'welcome-dismissed': boolean;
	recentPlans: string[];
	mostRecentExportDir?: string;
	mostRecentPlanDir?: string;
	updateDbs: UpdateDbConfig[];
	exportOptimization: ExportOptimization;
};

export type SettingChangeListener = (
	key: keyof Settings,
	value: SettingsValue
) => void;
