export type DBFileEntry = {
	hash: string;
	size: number;
	tags: number[];
};

export type DBJSON = {
	base_files_url: string;
	db_files: string[];
	db_id: string;
	db_url: string;
	files: Record<string, DBFileEntry>;
};

export type FileEntry = {
	type: 'mra' | 'rbf';
	relFilePath: string;
	fileName: string;
	remoteUrl: string;
	hash: string;
	size: number;
};

export type Update = {
	fileEntry: FileEntry;
	updateReason: 'missing' | 'updated' | 'corrupt';
};
