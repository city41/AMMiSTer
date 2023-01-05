import { ReadStream } from 'original-fs';
import SFTP from 'ssh2-sftp-client';
import { FileClient, FileClientConnectConfig } from './types';

class SFTPFileClient implements FileClient {
	private sftp: SFTP;

	constructor() {
		this.sftp = new SFTP();
	}

	async connect(config: FileClientConnectConfig): Promise<void> {
		await this.sftp.connect({
			host: config.host,
			port: parseInt(config.port, 10),
			username: config.username,
			password: config.password,
			retries: 2,
			retry_factor: 2,
			retry_minTimeout: 2000,
		});
	}

	async disconnect(): Promise<void> {
		return this.sftp.end();
	}

	async listDir(dirPath: string): Promise<string[]> {
		const entries = await this.sftp.list(dirPath);
		return entries.map((e) => e.name);
	}

	async isDir(filePath: string): Promise<boolean> {
		const s = await this.sftp.stat(filePath);
		return s.isDirectory;
	}

	async mkDir(dirPath: string, recursive?: boolean): Promise<void> {
		await this.sftp.mkdir(dirPath, recursive);
	}

	async rmDir(dirPath: string): Promise<void> {
		await this.sftp.rmdir(dirPath);
	}

	async putFile(data: ReadStream, destPath: string): Promise<string> {
		return this.sftp.put(data, destPath);
	}

	async deleteFile(filePath: string): Promise<void> {
		await this.sftp.delete(filePath);
	}

	async exists(filePath: string): Promise<boolean> {
		const r = await this.sftp.exists(filePath);
		return !!r;
	}
}

export { SFTPFileClient };
