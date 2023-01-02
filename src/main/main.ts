import path from 'node:path';
import Debug from 'debug';
import settings from 'electron-settings';
import { BrowserWindow, app, dialog, ipcMain, Menu, shell } from 'electron';
import * as nodeEnv from '../utils/node-env';

import * as catalog from './catalog';
import * as plan from './plan';
import * as exportPlan from './export';

import { DBJSON } from './catalog/types';
import { Plan } from './plan/types';
import { SambaConfig } from './export/types';

const SETTINGS_FILE = 'ammister-settings.json';

const debug = Debug('main/main.ts');

let mainWindow: BrowserWindow;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		height: 600,
		width: 800,
		webPreferences: {
			devTools: nodeEnv.dev,
			preload: path.join(__dirname, '../preload.bundle.js'),
			webSecurity: nodeEnv.prod,
		},
	});

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	const menu = Menu.buildFromTemplate([
		{
			label: 'File',
			submenu: [
				{
					label: 'New Plan',
					accelerator: 'Ctrl+n',
					click: () => mainWindow.webContents.send('menu:loadNewPlan'),
				},
				{
					label: 'Open Plan...',
					accelerator: 'Ctrl+o',
					click: async () => {
						const result = await dialog.showOpenDialog(mainWindow, {
							filters: [{ name: 'Plans', extensions: ['amip'] }],
						});

						if (!result.canceled) {
							const openedPlan = await plan.openPlan(result.filePaths[0]);
							if (openedPlan) {
								debug('Open Plan: sending opened plan to mainWindow');
								mainWindow.webContents.send('menu:loadOpenedPlan', openedPlan);
							} else {
								debug(
									'Open Plan: plan.openPlan returned null, nothing to send to mainWindow'
								);
							}
						}
					},
				},
				{
					label: 'Load Demo Plan...',
					click: () => mainWindow.webContents.send('menu:loadDemoPlan'),
				},
			],
		},
		{
			label: 'Catalog',
			submenu: [
				{
					label: 'Check For Updates...',
					id: 'catalog-check-for-updates',
					click: () => mainWindow.webContents.send('menu:kickOffCatalogUpdate'),
				},
			],
		},
		{
			label: 'Export',
			submenu: [
				{
					label: 'Export to Directory...',
					click: () => {
						mainWindow.webContents.send('menu:exportToDirectory');
					},
					id: 'export-export-to-directory',
				},
				{
					label: 'Export to MiSTer...',
					click: () => {
						mainWindow.webContents.send('menu:exportToMister');
					},
				},
			],
		},
		{
			label: 'Dev',
			submenu: [
				{
					click: () => mainWindow.reload(),
					label: 'Refresh',
					accelerator: 'Ctrl+r',
				},
				{
					click: () => mainWindow.webContents.toggleDevTools(),
					label: 'Dev Tools',
					accelerator: 'Ctrl+Shift+i',
				},
			],
		},
	]);

	Menu.setApplicationMenu(menu);

	// and load the index.html of the app.
	const indexPath = nodeEnv.dev ? '../index.html' : './index.html';
	mainWindow.loadFile(indexPath).finally(() => {
		/* no action */
	});

	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		// mainWindow = undefined;
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app
	.whenReady()
	.then(async () => {
		createWindow();

		app.on('activate', () => {
			if (BrowserWindow.getAllWindows.length === 0) createWindow();
		});
		console.log(
			'settings file',
			path.resolve(app.getPath('userData'), SETTINGS_FILE)
		);
		settings.configure({
			fileName: SETTINGS_FILE,
			prettify: true,
			numSpaces: 2,
		});
		await settings.set('rootDir', app.getPath('userData'));
	})
	.finally(() => {
		/* no action */
	});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('settings:getWelcomeDismissed', async () => {
	const result = await settings.get('welcome-dismissed');
	return result?.toString() === 'true';
});

ipcMain.handle('settings:setWelcomeDismissed', () => {
	return settings.set('welcome-dismissed', 'true');
});

ipcMain.on('renderer-ready', () => {
	// eslint-disable-next-line no-console
	console.log('Renderer is ready.');
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

ipcMain.on('export:exportToDirectory', async (event, plan: Plan) => {
	const result = await dialog.showOpenDialog(mainWindow, {
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
	async (event, plan: Plan, config: SambaConfig) => {
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

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

// eslint-disable-next-line import/prefer-default-export
export const exportedForTests = nodeEnv.test ? { createWindow } : undefined;
