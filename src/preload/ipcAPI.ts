import { ipcRenderer } from 'electron';

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
};

export { ipcAPI };
