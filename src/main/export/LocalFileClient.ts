import fsp from 'node:fs/promises';
import { ReadStream } from 'node:fs';
import mkdirp from 'mkdirp';
import winston from 'winston';
import { FileClient } from './types';

const FALSE_VIA_CATCH = 'false-via-catch';

class LocalFileClient implements FileClient {
	constructor(private logger: winston.Logger, private destDirPath: string) {
		this.logger.info({ destDirPath });
	}

	async connect(): Promise<void> {
		this.logger.info({
			[this.connect.name]: 'LocalFileCLient: nothing to connect to',
		});
	}

	async disconnect(): Promise<void> {
		this.logger.info({
			[this.disconnect.name]: 'LocalFileCLient: nothing to disconnect from',
		});
	}

	getMountPath() {
		return this.destDirPath;
	}

	async listDir(dirPath: string): Promise<string[]> {
		const entries = fsp.readdir(dirPath);
		this.logger.info({ [this.listDir.name]: entries });
		return entries;
	}

	async isDir(dirPath: string): Promise<boolean> {
		try {
			const stat = await fsp.stat(dirPath);
			const result = stat.isDirectory();
			this.logger.info({ [this.isDir.name]: { dirPath, result } });
			return result;
		} catch {
			this.logger.info({
				[this.isDir.name]: { dirPath, result: FALSE_VIA_CATCH },
			});
			return false;
		}
	}

	async mkDir(dirPath: string, recursive?: boolean): Promise<void> {
		this.logger.info({ [this.mkDir.name]: { dirPath, recursive } });
		if (recursive) {
			await mkdirp(dirPath);
		} else {
			await fsp.mkdir(dirPath);
		}
	}

	async rmDir(dirPath: string): Promise<void> {
		await fsp.rm(dirPath, { recursive: true, force: true, retryDelay: 500 });
	}

	async putFile(data: ReadStream, destPath: string): Promise<string> {
		const result = await fsp.writeFile(destPath, data);
		this.logger.info({ [this.putFile.name]: destPath, result });
		return `putFile: ${destPath}, success`;
	}

	async deleteFile(filePath: string): Promise<void> {
		this.logger.info({ [this.deleteFile.name]: filePath });
		return fsp.unlink(filePath);
	}

	async exists(filePath: string): Promise<boolean> {
		try {
			fsp.stat(filePath);
			this.logger.info({ [this.exists.name]: { filePath, result: true } });
			return true;
		} catch {
			this.logger.info({
				[this.exists.name]: { filePath, result: FALSE_VIA_CATCH },
			});
			return false;
		}
	}
}

export { LocalFileClient };
