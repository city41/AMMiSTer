import electronSettings from 'electron-settings';

export type SettingsValue = ReturnType<typeof electronSettings.getSync>;

export type UpdateDbConfig = {
	db_id: string;
	displayName: string;
	url: string;
	enabled: boolean;
};

export type Settings = {
	rootDir: string;
	downloadRoms: boolean;
	'welcome-dismissed': boolean;
	recentPlans: string[];
	mostRecentExportDir?: string;
	mostRecentPlanDir?: string;
	updateDbs: UpdateDbConfig[];
};

export type SettingChangeListener = (
	key: keyof Settings,
	value: SettingsValue
) => void;
