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

	getUpdateJson(url: string) {
		return ipcRenderer.invoke('db:getUpdateJson', url);
	},

	downloadUpdatesForDb(db: DBJSON) {
		return ipcRenderer.invoke('db:downloadUpdatesForDb', db);
	},
};

export { ipcAPI };
