import electronSettings from 'electron-settings';
import { Settings, SettingsValue } from './types';

const SETTINGS_FILE = 'ammister-settings.json';

async function init(userDataPath: string): Promise<void> {
	electronSettings.configure({
		fileName: SETTINGS_FILE,
		prettify: true,
		numSpaces: 2,
	});
	await electronSettings.set('rootDir', userDataPath);

	const hasDownloadRoms = await electronSettings.has('downloadRoms');

	if (!hasDownloadRoms) {
		await electronSettings.set('downloadRoms', false);
	}
}

async function getAllSettings(): Promise<Settings> {
	const settings = (await electronSettings.get()) as unknown as Settings;

	return settings;
}

async function getSetting<T>(key: keyof Settings): Promise<T> {
	const v = await electronSettings.get(key);
	return v as T;
}

async function setSetting<T extends SettingsValue>(
	key: string,
	value: T
): Promise<void> {
	return electronSettings.set(key, value);
}

async function setAllSettings(newSettings: Settings): Promise<void> {
	return electronSettings.set(newSettings);
}

export { init, getAllSettings, getSetting, setSetting, setAllSettings };
