import path from 'node:path';
import { ReadStream } from 'fs';
import { Client, FileInfo } from 'basic-ftp';
import winston from 'winston';
import { FileClient, FileClientConnectConfig } from './types';
import { misterPathJoiner } from '../util/fs';

const TIMEOUT_MS = 15 * 1000;

class FTPFileClient implements FileClient {
	private ftp: Client;
	private isDirCache: Record<string, FileInfo[]>;
	private mountPath: string;

	constructor(
		private logger: winston.Logger,
		mountPathSegments: string[],
		private connectConfig: FileClientConnectConfig
	) {
		this.ftp = new Client(TIMEOUT_MS);
		this.isDirCache = {};

		this.ftp.trackProgress((info) => {
			this.logger.info({ trackProgress: info });
		});

		this.ftp.ftp.log = (message: string) => {
			this.logger.info({ ftpLog: message });
		};

		// this will be something like ['media', '_Arcade'], and is
		// the root destination to write to
		this.mountPath = misterPathJoiner(...mountPathSegments);
	}

	getMountPath() {
		return this.mountPath;
	}

	getDestinationPathJoiner() {
		return misterPathJoiner;
	}

	async connect(): Promise<void> {
		this.logger.info({ [this.connect.name]: this.connectConfig });
		await this.ftp.access({
			host: this.connectConfig.host,
			user: this.connectConfig.username,
			password: this.connectConfig.password,
		});
	}

	async disconnect(): Promise<void> {
		this.logger.info('disconnect');
		this.ftp.close();
		this.isDirCache = {};
	}

	async listDir(dirPath: string): Promise<string[]> {
		const entries = await this.ftp.list(dirPath);
		this.logger.info({ [this.listDir.name]: entries });
		return entries.map((e) => e.name);
	}

	async isDir(dirPath: string): Promise<boolean> {
		try {
			const parentDir = path.dirname(dirPath);
			const entries =
				this.isDirCache[parentDir] ?? (await this.ftp.list(parentDir));
			this.isDirCache[parentDir] = entries;
			const entry = entries.find((e) => e.name === path.basename(dirPath));

			const result = entry?.isDirectory ?? false;
			this.logger.info({ [this.isDir.name]: dirPath, result });
			return result;
		} catch {
			return false;
		}
	}

	async mkDir(dirPath: string, recursive?: boolean): Promise<void> {
		this.logger.info({ [this.mkDir.name]: { dirPath, recursive } });
		await this.ftp.ensureDir(dirPath);
		// ensureDir also changes the directory
		await this.ftp.cd('/');
	}

	async rmDir(dirPath: string): Promise<void> {
		await this.ftp.removeDir(dirPath);
		this.logger.info({ [this.rmDir.name]: dirPath });
	}

	async putFile(data: ReadStream, destPath: string): Promise<string> {
		const result = await this.ftp.uploadFrom(data, destPath);
		this.logger.info({ [this.putFile.name]: destPath, result });
		return result.message;
	}

	async deleteFile(filePath: string): Promise<void> {
		await this.ftp.remove(filePath);
		this.logger.info({ [this.deleteFile.name]: filePath });
	}

	async exists(filePath: string): Promise<boolean> {
		try {
			this.ftp.lastMod(filePath);
			this.logger.info({ [this.exists.name]: filePath, result: true });
			return true;
		} catch {
			this.logger.info({ [this.exists.name]: filePath, result: false });
			return false;
		}
	}
}

export { FTPFileClient };
