/**
 * An entry in a db.json.zip file. It lacks a file name
 * because in db.json, the key is the file name
 */
export type DBFileEntry = {
	hash: string;
	size: number;
	tags: number[];
};

/**
 * A db.json.zip file. These files have other stuff
 * but this is the only part we care about
 */
export type DBJSON = {
	base_files_url: string;
	db_files: string[];
	db_id: string;
	db_url: string;
	files: Record<string, DBFileEntry>;
};

/**
 * A struct representing a mister file, mostly used
 * in local situations away from a db.json
 */
export type FileEntry = {
	/**
	 * the db.json file it came from
	 */
	db_id: string;
	type: 'mra' | 'rbf' | 'rom';
	/**
	 * Its relative filepath as found in the db.json,
	 * Typically starts with "_Arcade/", this rel file path
	 * is also used when storing it locally at
	 * <rootDir>/gameCache/<db_id>/<relFilePath>
	 */
	relFilePath: string;
	fileName: string;
	/**
	 * Where it can be found on the internet. Used to download
	 * the latest version of it. Basically just base_file_url/<relFilePath>
	 */
	remoteUrl: string;

	/**
	 * The md5 hash of the file. If not present, that means the file is missing
	 */
	md5?: string;
};

/**
 * Since roms in mra files can be multiple files separated by a pipe,
 * this type is used to capture that
 */
export type MissingRomEntry = {
	db_id: string;
	romFiles: string[];
	mameVersion: string;
};

/**
 * Represents an update for a mister file
 * missing: not present locally
 * updated: present locally, but there is a new version
 * corrupt: present locally, but seems incomplete/corrupt
 * fulfilled: during an update, some other game/core/whatever already got this file
 *
 * note: corrupt is not used (yet)
 */
export type UpdateReason = 'missing' | 'updated' | 'corrupt' | 'fulfilled';
export type Update = {
	/**
	 * The file to update
	 */
	fileEntry: FileEntry;
	updateReason: UpdateReason;
};

/**
 * The term "catalog" is used as "db" already has
 * meaning in relation to db.json files. A Catalog
 * is a json file of all of the AMMister's current gameCache
 */

/**
 * A file entry as found in the catalog. The current implementation
 * makes saving remoteUrl tough, so for now at least just omitting it.
 */
export type CatalogFileEntry = Omit<FileEntry, 'remoteUrl'>;

/**
 * The full local representation of a Mister arcade game. Has
 * all of the metadata and info on all of its files
 */
export type CatalogEntry = {
	favorite?: boolean;
	db_id: string;
	gameName: string;
	manufacturer: string[];
	category: string | null;
	yearReleased: number;
	orientation: 'vertical' | 'horizontal' | null;
	rom: string;
	mameVersion: string;
	titleScreenshotUrl: string | null;
	gameplayScreenshotUrl: string | null;
	files: {
		mra?: CatalogFileEntry;
		rbf?: CatalogFileEntry;
		roms: CatalogFileEntry[];
	};
};

/**
 * All of the local files that AMMister knows about.
 *
 * Sinde it is indexed by db_id, it's also can represent
 * a subcatalog by only having some dbs in it
 */
export type Catalog = {
	updatedAt: number;
} & Record<string, CatalogEntry[]>;

export type UpdateCallback = (args: {
	message: string;
	complete?: boolean;
	catalog?: Catalog;
	updates?: Update[];
}) => void;
