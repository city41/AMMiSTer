import { ipcRenderer } from 'electron';

const ipcAPI = {
	/** Notify main the renderer is ready. */
	rendererReady() {
		ipcRenderer.send('renderer-ready');
	},
	getArcadeGamesOnMister(ipAddress: string) {
		return ipcRenderer.invoke('mister:get-arcade-games', ipAddress);
	},
};

export { ipcAPI };
