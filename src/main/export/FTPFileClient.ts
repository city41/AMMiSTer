import { ReadStream } from 'original-fs';
import { Client } from 'basic-ftp';
import { FileClient, FileClientConnectConfig } from './types';

class FTPFileClient implements FileClient {
	private ftp: Client;

	constructor() {
		this.ftp = new Client();
	}

	async connect(config: FileClientConnectConfig): Promise<void> {
		await this.ftp.access({
			host: config.host,
			user: config.username,
			password: config.password,
		});
	}

	async disconnect(): Promise<void> {
		this.ftp.close();
	}

	async listDir(dirPath: string): Promise<string[]> {
		const entries = await this.ftp.list(dirPath);
		return entries.map((e) => e.name);
	}

	async isDir(dirPath: string): Promise<boolean> {
		// TODO: hmmmmm
		try {
			await this.listDir(dirPath);
			return true;
		} catch {
			return false;
		}
	}

	async mkDir(dirPath: string, _recursive?: boolean): Promise<void> {
		await this.ftp.ensureDir(dirPath);
		// ensureDir also changes the directory
		await this.ftp.cd('/');
	}

	async rmDir(dirPath: string): Promise<void> {
		await this.ftp.removeDir(dirPath);
	}

	async putFile(data: ReadStream, destPath: string): Promise<string> {
		const r = await this.ftp.uploadFrom(data, destPath);
		return r.message;
	}

	async deleteFile(filePath: string): Promise<void> {
		await this.ftp.remove(filePath);
	}

	async exists(filePath: string): Promise<boolean> {
		try {
			this.ftp.lastMod(filePath);
			return true;
		} catch {
			return false;
		}
	}
}

export { FTPFileClient };
