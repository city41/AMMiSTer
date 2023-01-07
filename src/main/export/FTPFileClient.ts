import path from 'node:path';
import { ReadStream } from 'original-fs';
import { Client, FileInfo } from 'basic-ftp';
import { FileClient, FileClientConnectConfig } from './types';

const TIMEOUT_MS = 15 * 1000;

class FTPFileClient implements FileClient {
	private ftp: Client;
	private isDirCache: Record<string, FileInfo[]>;

	constructor() {
		this.ftp = new Client(TIMEOUT_MS);
		this.isDirCache = {};
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
		this.isDirCache = {};
	}

	async listDir(dirPath: string): Promise<string[]> {
		const entries = await this.ftp.list(dirPath);
		return entries.map((e) => e.name);
	}

	async isDir(dirPath: string): Promise<boolean> {
		try {
			const parentDir = path.dirname(dirPath);
			const entries =
				this.isDirCache[parentDir] ?? (await this.ftp.list(parentDir));
			this.isDirCache[parentDir] = entries;
			const entry = entries.find((e) => e.name === path.basename(dirPath));

			return entry?.isDirectory ?? false;
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
