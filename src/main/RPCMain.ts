import cluster from 'node:cluster';
import WebSocket, { AddressInfo } from 'ws';

export interface RPCProxy {
	handleGetVersion(): Promise<string>;
}

class WSMain {
	_server: WebSocket.Server;
	_socket?: WebSocket;

	constructor(private _proxy: RPCProxy) {
		this._server = new WebSocket.Server({ port: 9999 });

		this._server.on('connection', (s) => {
			this._socket = s;
			s.on('message', this._onMessage);
			s.on('close', () => {
				this._socket = undefined;
			});
		});
	}

	private async _onMessage(message: string, ...args: any[]) {
		if (message === 'main:getVersion') {
			const version = await this._proxy.handleGetVersion();

			if (this._socket) {
				this._socket.send(version);
			}
		}
	}

	get address(): AddressInfo | string {
		return this._server.address();
	}

	close() {
		this._server.close();
	}
}

type WorkerMessage = {
	type: string;
	args: any[];
};

function rpcMain(): WSMain | undefined {
	if (cluster.isPrimary) {
		const worker = cluster.fork();

		const listeners: Record<string, (message: WorkerMessage) => void> = {};

		cluster.on('message', (message: WorkerMessage) => {
			const listener = listeners[message.type];
			listener?.(message);
		});

		function workerSend(type: string, cb: (response: WorkerMessage) => void) {
			listeners[type] = (message) => {
				cb(message);
				delete listeners[type];
			};
			worker.send(type);
		}

		const ws = new WSMain({
			handleGetVersion(): Promise<string> {
				return new Promise((resolve) => {
					workerSend('main:getVersion', (response: WorkerMessage) => {
						resolve(response.args[0] as string);
					});
				});
			},
		});

		return ws;
	} else {
		process.on('message', (message: WorkerMessage) => {
			switch (message.type) {
				case 'main:getVersion': {
					setImmediate(() => {
						process.send?.({ type: 'main:getVersion', args: ['1.2.3'] });
					});
				}
			}
		});
	}
}

export { rpcMain };
