import electronSettings from 'electron-settings';

export type SettingsValue = ReturnType<typeof electronSettings.getSync>;

export type Settings = {
	rootDir: string;
	downloadRoms: boolean;
	'welcome-dismissed': boolean;
	recentPlans: string[];
	mostRecentExportDir?: string;
	mostRecentPlanDir?: string;
};

export type SettingChangeListener = (
	key: keyof Settings,
	value: SettingsValue
) => void;
