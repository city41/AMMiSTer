import path from 'node:path';
import Debug from 'debug';
import settings from 'electron-settings';
import { BrowserWindow, app, dialog, ipcMain, Menu, shell } from 'electron';

import * as catalog from './catalog';
import * as plan from './plan';
import * as exportPlan from './export';

import { DBJSON } from './catalog/types';
import { Plan } from './plan/types';
import { FileClientConnectConfig } from './export/types';
import { getGameCacheDir } from './util/fs';

const SETTINGS_FILE = 'ammister-settings.json';

const debug = Debug('main/main.ts');

debug('versions', JSON.stringify(process.versions));

let mainWindow: BrowserWindow | undefined;

let planToLoadAfterMainWindowIsReady: string | null = null;
let lastPlanSavePath: string | null = null;

const isDev = app.getName() !== 'ammister';

async function loadPlan(planPath: string) {
	const openedPlan = await plan.openPlan(planPath);
	if (openedPlan) {
		debug('loadPlan: sending opened plan to mainWindow', planPath);
		mainWindow!.webContents.send('menu:loadOpenedPlan', openedPlan);
		lastPlanSavePath = planPath;
	} else {
		debug(
			'loadPlan: plan.openPlan returned null, returning null to let the UI know there is no plan',
			planPath
		);
		mainWindow!.webContents.send('menu:loadOpenedPlan', null);
	}
}

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			devTools: isDev,
			preload: path.join(__dirname, '../preload.bundle.js'),
			webSecurity: !isDev,
		},
	});

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	const menuTemplate = [
		{
			label: 'File',
			submenu: [
				{
					label: 'New Plan',
					accelerator: 'CommandOrControl+N',
					click: () => mainWindow!.webContents.send('menu:loadNewPlan'),
				},
				{
					label: 'Open Plan...',
					accelerator: 'CommandOrControl+O',
					click: async () => {
						const result = await dialog.showOpenDialog(mainWindow!, {
							filters: [{ name: 'Plans', extensions: ['amip'] }],
						});

						if (!result.canceled) {
							loadPlan(result.filePaths[0]);
						}
					},
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
						shell.showItemInFolder(path.resolve(gameCacheDir, 'catalog.json'));
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
					click: () => mainWindow!.reload(),
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

	// and load the index.html of the app.
	const indexPath = isDev ? '../index.html' : './index.html';
	mainWindow.loadFile(indexPath).finally(() => {
		if (planToLoadAfterMainWindowIsReady) {
			loadPlan(planToLoadAfterMainWindowIsReady);
		} else {
			const commandLinePlan = isDev ? process.argv[2] : process.argv[1];
			loadPlan(commandLinePlan);
		}
	});

	mainWindow.on('closed', () => {
		mainWindow = undefined;
	});
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
		createWindow();

		app.on('activate', () => {
			if (BrowserWindow.getAllWindows.length === 0) createWindow();
		});
		settings.configure({
			fileName: SETTINGS_FILE,
			prettify: true,
			numSpaces: 2,
		});
		await settings.set('rootDir', app.getPath('userData'));
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

ipcMain.handle('settings:getWelcomeDismissed', async () => {
	const result = await settings.get('welcome-dismissed');
	return result?.toString() === 'true';
});

ipcMain.handle('settings:setWelcomeDismissed', () => {
	return settings.set('welcome-dismissed', 'true');
});

ipcMain.handle('catalog:getDbJson', async (_event, url: string) => {
	return catalog.getDbJson(url);
});

ipcMain.handle(
	'catalog:downloadUpdatesForDb',
	async (_event, dbToUpdate: DBJSON) => {
		return catalog.downloadUpdatesForDb(dbToUpdate, () => {});
	}
);

ipcMain.handle('catalog:buildGameCatalog', async () => {
	return catalog.buildGameCatalog();
});

ipcMain.on('catalog:updateCatalog', async (event) => {
	const menuItem = Menu.getApplicationMenu()?.getMenuItemById(
		'catalog-check-for-updates'
	);

	if (menuItem) {
		menuItem.enabled = false;
	}

	catalog
		.updateCatalog((status) => {
			event.reply('catalog:updateCatalog-status', status);
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
	const result = await dialog.showSaveDialog(mainWindow!, {
		filters: [{ name: 'Plans', extensions: ['amip'] }],
	});

	if (!result.canceled && result.filePath) {
		lastPlanSavePath = result.filePath;
		plan.savePlan(p, result.filePath);
		return true;
	}

	return false;
});

ipcMain.handle('plan:savePlan', async (_event, p: Plan) => {
	if (!lastPlanSavePath) {
		const result = await dialog.showSaveDialog(mainWindow!, {
			filters: [{ name: 'Plans', extensions: ['amip'] }],
		});

		if (!result.canceled && result.filePath) {
			lastPlanSavePath = result.filePath;
		}
	}

	if (lastPlanSavePath) {
		plan.savePlan(p, lastPlanSavePath);
		return true;
	}

	return false;
});

ipcMain.on('export:exportToDirectory', async (event, plan: Plan) => {
	const result = await dialog.showOpenDialog(mainWindow!, {
		properties: ['openDirectory', 'createDirectory'],
	});

	if (result && !result.canceled && result.filePaths?.[0]) {
		const menuItem = Menu.getApplicationMenu()?.getMenuItemById(
			'export-export-to-directory'
		);

		if (menuItem) {
			menuItem.enabled = false;
		}

		exportPlan
			.exportToDirectory(plan, result.filePaths[0], (status) => {
				event.reply('export:exportToDirectory-status', status);
			})
			.finally(() => {
				if (menuItem) {
					menuItem.enabled = true;
				}
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

		exportPlan
			.exportToMister(plan, config, (status) => {
				event.reply('export:exportToMister-status', status);
			})
			.finally(() => {
				if (menuItem) {
					menuItem.enabled = true;
				}
			});
	}
);

export {};
