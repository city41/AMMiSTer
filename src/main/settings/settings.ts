import fs from 'node:fs';
import electronSettings from 'electron-settings';
import {
	SettingChangeListener,
	Settings,
	SettingsValue,
	UpdateDbConfig,
} from './types';
import { defaultUpdateDbs } from './defaultUpdateDbs';

const SETTINGS_FILE = 'ammister-settings.json';

const settingsChangeListeners: SettingChangeListener[] = [];

async function init(userDataPath: string): Promise<void> {
	electronSettings.configure({
		fileName: SETTINGS_FILE,
		prettify: true,
		numSpaces: 2,
	});
	await electronSettings.set('rootDir', userDataPath);

	const hasDownloadRoms = await hasSetting('downloadRoms');

	if (!hasDownloadRoms) {
		await setSetting('downloadRoms', false);
	}

	const hasUpdateDbs = await hasSetting('updateDbs');

	if (!hasUpdateDbs) {
		await setSetting('updateDbs', defaultUpdateDbs);
	} else {
		const existingUpdateDbs = await getSetting<UpdateDbConfig[]>('updateDbs');
		const newUpdateDbs = defaultUpdateDbs.filter((udb) => {
			return !existingUpdateDbs.some((edb) => edb.db_id === udb.db_id);
		});

		const finalUpdateDbs = existingUpdateDbs.concat(newUpdateDbs);
		await setSetting('updateDbs', finalUpdateDbs);
	}

	const hasExportOptimization = await hasSetting('exportOptimization');

	if (!hasExportOptimization) {
		await setSetting('exportOptimization', 'space');
	}
}

async function getAllSettings(): Promise<Settings> {
	const settings = (await electronSettings.get()) as unknown as Settings;

	return settings;
}

async function hasSetting(key: keyof Settings): Promise<boolean> {
	return electronSettings.has(key);
}

async function getSetting<T>(key: keyof Settings): Promise<T> {
	const v = await electronSettings.get(key);
	return v as T;
}

async function setSetting<T extends SettingsValue>(
	key: keyof Settings,
	value: T
): Promise<void> {
	await electronSettings.set(key, value);
	settingsChangeListeners.forEach((scl) => scl(key, value));
}

async function setAllSettings(newSettings: Settings): Promise<void> {
	return electronSettings.set(newSettings);
}

async function getRecentPlans(): Promise<string[]> {
	const recentPlans = await getSetting<string[]>('recentPlans');

	// clear out any plans that have since been deleted
	return (recentPlans ?? []).filter((rp) => {
		try {
			return fs.statSync(rp).isFile();
		} catch (e) {
			return false;
		}
	});
}

async function addRecentPlan(planPath: string): Promise<void> {
	const recentPlans = await getRecentPlans();

	if (!recentPlans.some((rp) => rp === planPath)) {
		recentPlans.unshift(planPath);
	}

	while (recentPlans.length > 3) {
		recentPlans.pop();
	}

	await setSetting('recentPlans', recentPlans);
}

function onSettingChange(listener: SettingChangeListener) {
	settingsChangeListeners.push(listener);
}

export {
	init,
	getAllSettings,
	getSetting,
	setSetting,
	setAllSettings,
	getRecentPlans,
	addRecentPlan,
	onSettingChange,
};
