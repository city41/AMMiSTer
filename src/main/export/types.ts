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
