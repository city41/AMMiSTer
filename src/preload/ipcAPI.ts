import { ipcRenderer } from 'electron';

const ipcAPI = {
	/** Notify main the renderer is ready. */
	rendererReady() {
		ipcRenderer.send('renderer-ready');
	},
	getHomeDirFiles() {
		return ipcRenderer.invoke('homeDir:get-files');
	},
};

export { ipcAPI };
