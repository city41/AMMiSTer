import cluster from 'node:cluster';
import WebSocket, { AddressInfo } from 'ws';

type Request = {
	type: string;
	args: any[];
};

type Response = {
	type: string;
	result: string;
};

export interface RPCHandler {
	handle(message: Request): Promise<Response>;
}

class WSMain {
	_server: WebSocket.Server;
	_socket?: WebSocket;

	constructor(private _handler: RPCHandler) {
		this._server = new WebSocket.Server({ port: 9999 });

		this._server.on('connection', (s) => {
			this._socket = s;
			s.on('message', this._onMessage.bind(this));
			s.on('close', () => {
				this._socket = undefined;
			});
		});
	}

	private async _onMessage(rawMessage: Buffer) {
		const message = JSON.parse(rawMessage.toString()) as Request;
		const response = await this._handler.handle(message);
		this._socket?.send(JSON.stringify(response));
	}

	get address(): AddressInfo | string {
		return this._server.address();
	}

	close() {
		this._server.close();
	}
}

function rpcMain(): WSMain | undefined {
	cluster.setupPrimary({
		exec: process.execPath,
		execArgv: process.execArgv,
	});

	if (cluster.isPrimary) {
		const worker = cluster.fork();

		const listeners: Record<string, (response: Response) => void> = {};

		cluster.on('message', (_worker: Worker, response: Response) => {
			const listener = listeners[response.type];
			listener?.(response);
		});

		function workerSend(message: Request, cb: (response: Response) => void) {
			listeners[message.type] = (response) => {
				cb(response);
				delete listeners[message.type];
			};
			worker.send(message);
		}

		const ws = new WSMain({
			handle(message: Request): Promise<Response> {
				return new Promise((resolve) => {
					workerSend(message, (response: Response) => {
						resolve(response);
					});
				});
			},
		});

		return ws;
	} else {
		process.on('message', (message: Request) => {
			switch (message.type) {
				case 'main:getVersion': {
					setImmediate(() => {
						process.send?.({
							type: 'main:getVersion',
							result: '1.2.3-dummy',
						});
					});
				}
			}
		});
	}
}

export { rpcMain };
