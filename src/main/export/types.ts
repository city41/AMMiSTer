import { ReadStream } from 'original-fs';

export type ExportType = 'directory' | 'mister';

export type ExportError = {
	type: 'connect-fail' | 'file-error' | 'network-error' | 'unknown';
	fileOp?: FileOperation;
	message?: string;
};

export type ExportStatus = {
	exportType: ExportType;
	message: string;
	complete?: boolean;
	error?: ExportError;
	canceled?: boolean;
};

export type ExportCallback = (args: ExportStatus) => boolean;

type CopyFileOperation = {
	action: 'copy';
	srcPath: string;
	destPath: string;
};

type DeleteFileOperation = {
	action: 'delete';
	destPath: string;
};

export type FileOperation = CopyFileOperation | DeleteFileOperation;

export type SrcExactFileOperationPath = {
	type: 'exact';
	db_id?: string;
	cacheRelPath: string;
	destRelPath: string;
};

export type SrcDatedFilenameFileOperationPath = {
	type: 'dated-filename';
	db_id?: string;
	cacheRelDirPath: string;
	destRelDirPath: string;
	fileName: string;
	fileNameBase: string;
	extension: string;
	date: Date;
};

export type SrcFileOperationPath =
	| SrcExactFileOperationPath
	| SrcDatedFilenameFileOperationPath;

export type DestExactFileOperationPath = {
	type: 'exact';
	db_id?: string;
	relPath: string;
};

export type DestDatedFilenameFileOperationPath = {
	type: 'dated-filename';
	db_id?: string;
	relDirPath: string;
	fileName: string;
	fileNameBase: string;
	extension: string;
	date: Date;
};

export type DestFileOperationPath =
	| DestExactFileOperationPath
	| DestDatedFilenameFileOperationPath;

export type FileClientConnectConfig = {
	host: string;
	port: string;
	mount: 'sdcard' | `usb${number}`;
	username: string;
	password: string;
};

export type PathJoiner = (...segments: string[]) => string;

export interface FileClient {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	getMountPath(): string;
	getDestinationPathJoiner(): PathJoiner;

	listDir(dirPath: string): Promise<string[]>;
	isDir(filePath: string): Promise<boolean>;
	mkDir(dirPath: string, recursive?: boolean): Promise<void>;
	rmDir(dirPath: string): Promise<void>;

	putFile(data: ReadStream, destPath: string): Promise<string>;
	deleteFile(filePath: string): Promise<void>;
	exists(filePath: string): Promise<boolean>;
}
