import { ipcRenderer } from 'electron';
import { DBJSON } from 'src/main/db/types';

const ipcAPI = {
	/** Notify main the renderer is ready. */
	rendererReady() {
		ipcRenderer.send('renderer-ready');
	},
	getArcadeGamesOnMister(ipAddress: string) {
		return ipcRenderer.invoke('mister:getArcadeGames', ipAddress);
	},

	getDbJson(url: string) {
		return ipcRenderer.invoke('db:getDbJson', url);
	},

	downloadUpdatesForDb(db: DBJSON) {
		return ipcRenderer.invoke('db:downloadUpdatesForDb', db);
	},

	buildGameCatalog() {
		return ipcRenderer.invoke('db:buildGameCatalog');
	},
};

export { ipcAPI };
