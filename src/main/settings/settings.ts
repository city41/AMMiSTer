import fs from 'node:fs';
import electronSettings from 'electron-settings';
import {
	SettingChangeListener,
	Settings,
	SettingsValue,
	UpdateDbConfig,
} from './types';
import { defaultUpdateDbs } from './defaultUpdateDbs';

// This is located at <electron-user-dir>/ammister in prod mode
// and <electron-user-dir>/Electron/ in dev mode
const SETTINGS_FILE = 'ammister-settings.json';

const settingsChangeListeners: SettingChangeListener[] = [];

async function init(userDataPath: string): Promise<void> {
	electronSettings.configure({
		fileName: SETTINGS_FILE,
		prettify: true,
		numSpaces: 2,
	});

	await setSetting('rootDir', userDataPath);
	await setDefaultSetting('downloadRoms', false);
	await setDefaultSetting('exportOptimization', 'space');
	await setDefaultSetting('destPathsToIgnore', [
		// this file is needed for people in Jotego's beta program.
		// AMMister doesn't really know anything about it, but if we find it
		// on a mister (or directory), we should leave it alone
		// https://github.com/city41/AMMiSTer/issues/124
		'games/mame/jtbeta.zip',
	]);

	const hasUpdateDbs = await hasSetting('updateDbs');

	let existingUpdateDbs: UpdateDbConfig[];
	if (!hasUpdateDbs) {
		existingUpdateDbs = [];
	} else {
		existingUpdateDbs = await getSetting<UpdateDbConfig[]>('updateDbs');
	}

	// if new dbs were added since the user
	// last launched the app, add them to their config
	const newUpdateDbs = defaultUpdateDbs.filter((udb) => {
		return !existingUpdateDbs.some((edb) => edb.db_id === udb.db_id);
	});

	const finalUpdateDbs = existingUpdateDbs.concat(newUpdateDbs);
	await setSetting('updateDbs', finalUpdateDbs);
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

async function setDefaultSetting<T extends SettingsValue>(
	key: keyof Settings,
	value: T
): Promise<void> {
	if (!(await hasSetting(key))) {
		await setSetting(key, value);
	}
}

async function setAllSettings(newSettings: Settings): Promise<void> {
	return electronSettings.set(newSettings);
}

/**
 * Recent plans are used to populate the "open recent" menu item.
 *
 * This function returns the recent plans, but clears out any that are
 * not found, likely due to the user deleting them
 */
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

/**
 * Adds a recently opened plan to the recent plans list. Used to populate
 * the "open recent" menu item.
 *
 * Keeps the 3 most recent plans
 */
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
