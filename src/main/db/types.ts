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
	db_id: string;
	type: 'mra' | 'rbf' | 'rom';
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

type CatalogFileEntry = Omit<FileEntry, 'remoteUrl'>;

export type CatalogEntry = {
	db_id: string;
	gameName: string;
	manufacturer: string[];
	yearReleased: number;
	orientation: 'vertical' | 'horizontal';
	rom: string;
	titleScreenshotUrl: string;
	gameplayScreenshotUrl: string;
	files: {
		mra?: CatalogFileEntry;
		rbf?: CatalogFileEntry;
		rom?: CatalogFileEntry;
	};
};

export type Catalog = {
	[db_id: string]: CatalogEntry[];
};
