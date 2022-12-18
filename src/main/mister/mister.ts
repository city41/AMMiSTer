import Client from 'ssh2-sftp-client';

async function getArcadeGames(ipAddress: string) {
	const client = new Client();
	await client.connect({
		host: ipAddress,
		port: 22,
		username: 'root',
		password: '1',
	});

	const files = await client.list('/media/fat/_Arcade');

	return files.map((f) => f.name);
}

export { getArcadeGames };
