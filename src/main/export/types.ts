export type UpdateCallback = (args: {
	message: string;
	complete?: boolean;
}) => void;

type CopyFileOperation = {
	action: 'copy';
	srcPath: string;
	destPath: string;
};

type DeleteFileOperation = {
	action: 'delete';
	destPath: string;
};

type MoveFileOperation = {
	action: 'move';
	srcPath: string;
	destPath: string;
};

export type FileOperation =
	| CopyFileOperation
	| DeleteFileOperation
	| MoveFileOperation;

export type SambaConfig = {
	host: string;
	domain: string;
	share: string;
	username: string;
	password: string;
};

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
