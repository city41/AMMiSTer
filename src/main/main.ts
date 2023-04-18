import path from './util/universalPath';
import nodepath from 'node:path';
import Debug from 'debug';
import mkdirp from 'mkdirp';
import {
	BrowserWindow,
	app,
	dialog,
	ipcMain,
	Menu,
	shell,
	MenuItemConstructorOptions,
} from 'electron';

import * as catalog from './catalog';
import * as plan from './plan';
import * as exportPlan from './export';
import * as settings from './settings';

import { Plan } from './plan/types';
import { FileClientConnectConfig } from './export/types';
import { getGameCacheDir } from './util/fs';
import { Settings, SettingsValue } from './settings/types';
import { getUniqueBaseName } from './util/getUniqueBaseName';
import { openPlanDialog, savePlanDialog } from './util/dialog';

const debug = Debug('main/main.ts');

let mainWindow: BrowserWindow | undefined;

let planToLoadAfterMainWindowIsReady: string | null = null;
let lastPlanSavePath: string | null = null;

const isDev = app.getName() !== 'ammister';

async function loadPlan(planPath: string) {
	const openedPlan = await plan.openPlan(planPath);
	if (openedPlan) {
		debug('loadPlan: sending opened plan to mainWindow', planPath);
		mainWindow!.webContents.send('menu:loadOpenedPlan', {
			plan: openedPlan,
			planPath,
		});
		lastPlanSavePath = planPath;
		await settings.addRecentPlan(planPath);
		await settings.setSetting('mostRecentPlanDir', path.dirname(planPath));
	} else {
		debug(
			'loadPlan: plan.openPlan returned null, returning null to let the UI know there is no plan',
			planPath
		);
		mainWindow!.webContents.send('menu:loadOpenedPlan', null);
	}
}

// tell the UI no plan is loaded so it can show the blank slate
async function uiNoPlan() {
	mainWindow!.webContents.send('plan:noPlan');
}

async function buildMainMenu(): Promise<void> {
	const recentPlans = await settings.getRecentPlans();

	const menuTemplate: MenuItemConstructorOptions[] = [
		{
			label: 'File',
			submenu: [
				{
					label: 'New Plan',
					accelerator: 'CommandOrControl+N',
					click: () => {
						lastPlanSavePath = null;
						mainWindow!.webContents.send('menu:loadNewPlan');
					},
				},
				{
					type: 'separator',
				},
				{
					label: 'Open Plan...',
					accelerator: 'CommandOrControl+O',
					click: async () => {
						const openPlanPath = await openPlanDialog(mainWindow!);

						if (openPlanPath) {
							loadPlan(openPlanPath);
						}
					},
				},
				{
					label: 'Open Recent',
					id: 'open-recent',
					submenu: recentPlans.map((rp) => {
						return {
							label: getUniqueBaseName(rp, recentPlans),
							click: () => {
								loadPlan(rp);
							},
						};
					}),
				},
				{
					type: 'separator',
				},
				{
					label: 'Save Plan',
					accelerator: 'CommandOrControl+S',
					click: async () => {
						mainWindow!.webContents.send('menu:savePlan');
					},
				},
				{
					label: 'Save Plan As...',
					accelerator: 'CommandOrControl+shift+S',
					click: async () => {
						mainWindow!.webContents.send('menu:savePlanAs');
					},
				},
				{
					type: 'separator',
				},
				{
					label: 'Settings...',
					accelerator: 'CommandOrControl+,',
					click: async () => {
						mainWindow!.webContents.send('menu:settings');
					},
				},
				{
					type: 'separator',
				},
				{
					label: 'Quit',
					accelerator: 'CommandOrControl+Q',
					click: () => {
						app.quit();
					},
				},
			],
		},
		{
			label: 'Edit',
			submenu: [
				{
					label: 'Undo',
					accelerator: 'CommandOrControl+Z',
					click: () => mainWindow!.webContents.send('menu:undo'),
				},
				{
					label: 'Redo',
					accelerator: 'CommandOrControl+Y',
					click: () => mainWindow!.webContents.send('menu:redo'),
				},
				{
					type: 'separator',
				},
				{
					label: 'Copy',
					role: 'copy',
				},
			],
		},
		{
			label: 'Catalog',
			submenu: [
				{
					label: 'Check For Updates...',
					accelerator: '',
					id: 'catalog-check-for-updates',
					click: () =>
						mainWindow!.webContents.send('menu:kickOffCatalogUpdate'),
				},
				{
					label: 'Open Folder',
					click: async () => {
						const gameCacheDir = await getGameCacheDir();
						await mkdirp(gameCacheDir);
						shell.openPath(gameCacheDir);
					},
				},
			],
		},
		{
			label: 'Export',
			submenu: [
				{
					label: 'Export to Directory...',
					accelerator: '',
					click: () => {
						mainWindow!.webContents.send('menu:exportToDirectory');
					},
					id: 'export-export-to-directory',
				},
				{
					label: 'Export to MiSTer...',
					accelerator: '',
					click: () => {
						mainWindow!.webContents.send('menu:exportToMister');
					},
				},
			],
		},
	];

	if (isDev) {
		menuTemplate.push({
			label: 'Dev',
			submenu: [
				{
					label: 'Load Demo Plan...',
					accelerator: '',
					click: () => mainWindow!.webContents.send('menu:loadDemoPlan'),
				},
				{
					label: 'Refresh',
					accelerator: 'CommandOrControl+R',
					click: () => mainWindow!.webContents.reloadIgnoringCache(),
				},
				{
					label: 'Dev Tools',
					accelerator: 'CommandOrControl+Shift+I',
					click: () => mainWindow!.webContents.toggleDevTools(),
				},
			],
		});
	}

	Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

async function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			devTools: isDev,
			// nodepath is to handle __dirname being OS specific
			// by using an OS specific join, the resulting path is correct
			// on Windows and posix
			preload: nodepath.join(__dirname, '../preload.bundle.js'),
			webSecurity: !isDev,
		},
	});

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	settings.onSettingChange((key, value) => {
		if (key === 'recentPlans') {
			debug('onSettingsChange', key, value);
			buildMainMenu();
		}
	});

	await buildMainMenu();

	// and load the index.html of the app.
	const indexPath = isDev ? '../index.html' : './index.html';

	mainWindow.webContents.on('dom-ready', () => {
		if (planToLoadAfterMainWindowIsReady) {
			loadPlan(planToLoadAfterMainWindowIsReady);
		} else {
			const commandLinePlan = isDev ? process.argv[2] : process.argv[1];
			if (
				typeof commandLinePlan === 'string' &&
				commandLinePlan.endsWith('amip')
			) {
				loadPlan(commandLinePlan);
			} else {
				uiNoPlan();
			}
		}
	});

	mainWindow.on('closed', () => {
		mainWindow = undefined;
	});

	mainWindow.loadFile(indexPath).finally(() => {});
}

// workaround for crashing on Windows
// https://github.com/electron/electron/issues/32074
if (process.platform === 'win32') {
	// TODO: likely all of these are not needed
	app.commandLine.appendSwitch('disable-gpu');
	app.commandLine.appendSwitch('disable-software-rasterizer');
	app.commandLine.appendSwitch('disable-gpu-compositing');
	app.commandLine.appendSwitch('disable-gpu-rasterization');
	app.commandLine.appendSwitch('disable-gpu-sandbox');
	app.commandLine.appendSwitch('--no-sandbox');
	app.disableHardwareAcceleration();
}

app
	.whenReady()
	.then(async () => {
		await settings.init(app.getPath('userData'));
		await createWindow();

		app.on('activate', () => {
			if (BrowserWindow.getAllWindows.length === 0) createWindow();
		});
	})
	.finally(() => {});

app.on('open-file', (event, filePath) => {
	event.preventDefault();

	if (mainWindow?.isEnabled()) {
		loadPlan(filePath);
	} else {
		planToLoadAfterMainWindowIsReady = filePath;
	}
});

app.on('window-all-closed', () => {
	app.quit();
});

ipcMain.handle('main:getVersion', async () => {
	return app.getVersion();
});

ipcMain.handle('settings:getAllSettings', async () => {
	return settings.getAllSettings();
});

ipcMain.handle('settings:getSetting', async (_event, key: keyof Settings) => {
	return settings.getSetting(key);
});

ipcMain.handle(
	'settings:setAllSettings',
	async (_event, newSettings: Settings) => {
		return settings.setAllSettings(newSettings);
	}
);

ipcMain.handle(
	'settings:setSetting',
	async (_event, key: keyof Settings, value: SettingsValue) => {
		return settings.setSetting(key, value);
	}
);

ipcMain.handle('catalog:getDbJson', async (_event, url: string) => {
	return catalog.getDbJson(url);
});

let updateProceeding = true;
ipcMain.handle('catalog:cancelUpdateCatalog', () => {
	updateProceeding = false;
});

ipcMain.on('catalog:updateCatalog', async (event) => {
	const menuItem = Menu.getApplicationMenu()?.getMenuItemById(
		'catalog-check-for-updates'
	);

	if (menuItem) {
		menuItem.enabled = false;
	}
	updateProceeding = true;

	catalog
		.updateCatalog((status) => {
			event.reply('catalog:updateCatalog-status', status);
			return updateProceeding;
		})
		.finally(() => {
			if (menuItem) {
				menuItem.enabled = true;
			}
		});
});

ipcMain.handle('catalog:getCurrentCatalog', async () => {
	return catalog.getCurrentCatalog();
});

ipcMain.handle('plan:newPlan', () => {
	return plan.newPlan();
});

ipcMain.handle('plan:savePlanAs', async (_event, p: Plan) => {
	const planSavePath = await savePlanDialog(mainWindow!);

	if (planSavePath) {
		// savePlan will return the actual path that the plan got saved to
		// typically it adds '.amip' if it is missing
		const savedPlanPath = await plan.savePlan(p, planSavePath);
		lastPlanSavePath = savedPlanPath;
		await settings.addRecentPlan(savedPlanPath);

		return { wasSaved: true, planPath: savedPlanPath };
	}

	return { wasSaved: false, planPath: null };
});

ipcMain.handle('plan:savePlan', async (_event, p: Plan) => {
	if (!lastPlanSavePath) {
		const planSavePath = await savePlanDialog(mainWindow!);

		if (planSavePath) {
			lastPlanSavePath = planSavePath;
		}
	}

	if (lastPlanSavePath) {
		// savePlan will return the actual path that the plan got saved to
		// typically it adds '.amip' if it is missing
		const savedPlanPath = await plan.savePlan(p, lastPlanSavePath);
		lastPlanSavePath = savedPlanPath;
		await settings.addRecentPlan(savedPlanPath);

		return { wasSaved: true, planPath: savedPlanPath };
	}

	return { wasSaved: false, planPath: null };
});

let exportProceeding = true;
ipcMain.handle('export:cancelExport', () => {
	exportProceeding = false;
});

ipcMain.on('export:exportToDirectory', async (event, plan: Plan) => {
	const mostRecentExportDir = await settings.getSetting<string | undefined>(
		'mostRecentExportDir'
	);

	const defaultPathProp = mostRecentExportDir
		? { defaultPath: mostRecentExportDir }
		: {};

	const result = await dialog.showOpenDialog(mainWindow!, {
		...defaultPathProp,
		properties: ['openDirectory', 'createDirectory'],
	});

	if (result && !result.canceled && result.filePaths?.[0]) {
		exportProceeding = true;

		const menuItem = Menu.getApplicationMenu()?.getMenuItemById(
			'export-export-to-directory'
		);

		if (menuItem) {
			menuItem.enabled = false;
		}

		exportPlan
			.exportToDirectory(plan, result.filePaths[0], (status) => {
				event.reply('export:exportToDirectory-status', status);
				return exportProceeding;
			})
			.finally(() => {
				if (menuItem) {
					menuItem.enabled = true;
				}
				settings.setSetting('mostRecentExportDir', result.filePaths[0]);
			});
	}
});

ipcMain.on(
	'export:exportToMister',
	async (event, plan: Plan, config: FileClientConnectConfig) => {
		const menuItem = Menu.getApplicationMenu()?.getMenuItemById(
			'export-export-to-mister'
		);

		if (menuItem) {
			menuItem.enabled = false;
		}

		exportProceeding = true;

		exportPlan
			.exportToMister(plan, config, (status) => {
				event.reply('export:exportToMister-status', status);
				return exportProceeding;
			})
			.finally(() => {
				if (menuItem) {
					menuItem.enabled = true;
				}
			});
	}
);

export {};
