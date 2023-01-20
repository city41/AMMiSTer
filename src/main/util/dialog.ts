import path from 'node:path';
import { BrowserWindow, dialog } from 'electron';
import * as settings from '../settings';

async function savePlanDialog(win: BrowserWindow): Promise<string | null> {
	const mostRecentDir = await settings.getSetting<string | undefined>(
		'mostRecentPlanDir'
	);

	const defaultPathProp = mostRecentDir ? { defaultPath: mostRecentDir } : {};

	const result = await dialog.showSaveDialog(win, {
		...defaultPathProp,
		filters: [{ name: 'Plans', extensions: ['amip'] }],
	});

	if (!result.canceled && result.filePath) {
		await settings.setSetting(
			'mostRecentPlanDir',
			path.dirname(result.filePath)
		);
		return result.filePath;
	} else {
		return null;
	}
}

async function openPlanDialog(win: BrowserWindow): Promise<string | null> {
	const mostRecentDir = await settings.getSetting<string | undefined>(
		'mostRecentPlanDir'
	);

	const defaultPathProp = mostRecentDir ? { defaultPath: mostRecentDir } : {};

	const result = await dialog.showOpenDialog(win, {
		...defaultPathProp,
		filters: [{ name: 'Plans', extensions: ['amip'] }],
	});

	if (!result.canceled && result.filePaths[0]) {
		await settings.setSetting(
			'mostRecentPlanDir',
			path.dirname(result.filePaths[0])
		);
		return result.filePaths[0];
	} else {
		return null;
	}
}

export { savePlanDialog, openPlanDialog };
