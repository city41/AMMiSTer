declare global {
	interface Window {
		/** APIs for Electron IPC */
		ipcAPI?: typeof import('../preload/ipcAPI').ipcAPI;
	}
}

type Game = {
	name: string;
	developer: string;
	orientation: 'horizontal' | 'vertical';
};

type MRA = {
	fileName: `${string}.mra`;
	hash: string;
	lastUpdated: string;
};

// Makes TS sees this as an external modules so we can extend the global scope.
export {};
