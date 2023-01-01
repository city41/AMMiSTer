export type UpdateCallback = (args: {
	message: string;
	complete?: boolean;
}) => void;

type CopyFileOperation = {
	action: 'copy';
	srcPath: string;
	destPath: string;
};

type CopyIfExistsFileOperation = {
	action: 'copy-if-exists';
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
	| CopyIfExistsFileOperation
	| DeleteFileOperation
	| MoveFileOperation;
