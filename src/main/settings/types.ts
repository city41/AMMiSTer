import electronSettings from 'electron-settings';

export type SettingsValue = ReturnType<typeof electronSettings.getSync>;

export type Settings = {
	rootDir: string;
	downloadRoms: boolean;
	'welcome-dismissed': boolean;
};
