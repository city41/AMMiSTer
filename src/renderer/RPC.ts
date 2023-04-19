class RPC {
	private _earlyMessages: any[] = [];
	private _pendingMessages: any[] = [];
	private _socket?: WebSocket;

	_onMessage(e: MessageEvent<any>) {
		const data = JSON.parse(e.data);

		const pendingMessages = this._pendingMessages.filter(
			(pm) => pm.type === data.type
		);
		pendingMessages.forEach((pm) => {
			pm.resolve(data.result);
		});

		this._pendingMessages = this._pendingMessages.filter(
			(pm) => !pendingMessages.includes(pm)
		);
	}

	open(port: number) {
		this._socket = new WebSocket(`ws://localhost:${port}`);
		this._socket.onmessage = this._onMessage.bind(this);

		this._socket.onopen = () => {
			this._earlyMessages.forEach((em) => {
				this._socket!.send(JSON.stringify({ type: em.type, args: em.args }));
				this._pendingMessages.push(em);
			});

			this._earlyMessages = [];
		};
	}

	close() {
		this._socket?.close();
	}

	getVersion(): Promise<string> {
		return new Promise((resolve) => {
			const queue = this._socket ? this._pendingMessages : this._earlyMessages;
			queue.push({
				type: 'main:getVersion',
				resolve,
			});

			this._socket?.send(JSON.stringify({ type: 'main:getVersion' }));
		});
	}
}

export { RPC };
