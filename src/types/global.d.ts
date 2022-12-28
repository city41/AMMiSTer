declare global {
	interface Window {
		/** APIs for Electron IPC */
		ipcAPI: typeof import('../preload/ipcAPI').ipcAPI;
	}
}

// Makes TS sees this as an external modules so we can extend the global scope.
export {};
