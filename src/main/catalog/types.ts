/**
 * An entry in a db.json.zip file. It lacks a file name
 * because in db.json, the key is the file name
 */
export type DBFileEntry = {
	hash: string;
	size: number;
	tags: number[];

	/**
	 * In some dbs, the url for downloading the file is
	 * <base_files_url>/<key to this file in the object>,
	 * and in other dbs, they include an explicit download url
	 * here
	 */
	url?: string;
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
 * A struct representing a mister file (ie an mra, a core, etc), mostly used
 * in local situations away from a db.json
 */
export type HashedFileEntry = {
	/**
	 * the db.json file id it came from
	 */
	db_id: string;
	type: 'mra' | 'rbf';

	/**
	 * Its relative filepath as found in the db.json.
	 * This is mostly only used for reference, as relFilePath
	 * is used primarily for file operations.
	 *
	 * The two can differ as some dbs already do a simple "organization"
	 * that AMMiSter does not want. Instead the user can put the game wherever they want.
	 */
	dbRelFilePath: string;

	/**
	 * Its relative filepath as found in the db.json,
	 * except any folders between "_Arcade" or "Arcade/core" and the file have been removed.
	 * This is done to "undo" organization already found in some dbs.
	 *
	 * Typically starts with "_Arcade/" or "_Arcade/cores", this rel file path
	 * is also used when storing it locally at
	 * <rootDir>/gameCache/<db_id>/<relFilePath>
	 */
	relFilePath: string;

	/**
	 * the file's name. In the case of MRAs, this is visible in the UI at times,
	 * mostly when a plan has an mra path in it that is no longer in the catalog
	 */
	fileName: string;

	/**
	 * Where it can be found on the internet. Used to download
	 * the latest version of it. Basically just base_file_url/<relFilePath>,
	 * but some dbs have a specific url entry for each file. In that case,
	 * that url is populated here.
	 */
	remoteUrl: string;

	/**
	 * Optional since we don't store rom hashes
	 * TODO: make discriminated unions
	 */
	md5: string;

	/**
	 * The size of the file, in bytes
	 */
	size: number;
};

/**
 * ROM files are not hashed, so this is really a type for ROM files.
 *
 * TODO: now that we are using the arcade rom db,
 * I think they now have hashes
 */
export type NonHashedFileEntry = {
	/**
	 * the db.json file it came from
	 */
	db_id: string;
	type: 'rom';
	/**
	 * Its relative filepath as found in the db.json,
	 * Typically starts with "games/mame/", this rel file path
	 * is also used when storing it locally at
	 * <rootDir>/gameCache/<db_id>/<relFilePath>
	 */
	relFilePath: string;
	fileName: string;
	/**
	 * Where it can be found on the internet. Used to download
	 * the latest version of it. Basically just base_file_url/<relFilePath>,
	 * or can be from the url in the file entry for the arcade rom db
	 */
	remoteUrl: string;

	/**
	 * The size of the file, in bytes
	 *
	 * TODO: this is calculated locally, but the arcade rom db
	 * has this.
	 */
	size: number;
};

export type FileEntry = HashedFileEntry | NonHashedFileEntry;

/**
 * Since roms in mra files can be multiple files separated by a pipe,
 * this type is used to capture that. A typical MRA might have multiple
 * of these.
 */
export type MissingRomEntry = {
	db_id: string;
	romFile: string;
	remoteUrl: string | null;
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
 * ok = file is presnt
 * corrupt = does not hash to the stored hash value
 * missing = not able to download this file (most common with ROMs not on archive.org)
 * unexpected-missing = was fine, but went missing, this gets set when a plan audit
 * discovers a game should be ok but the file is actually missing
 */
type CatalogFileEntryStatus =
	| 'ok'
	| 'corrupt'
	| 'missing'
	| 'unexpected-missing';

/**
 * A file entry as found in the catalog. The current implementation
 * makes saving remoteUrl tough, so for now at least just omitting it.
 */
export type HashedCatalogFileEntry = Omit<HashedFileEntry, 'remoteUrl'> & {
	status: CatalogFileEntryStatus;
};

export type NonHashedCatalogFileEntry = Omit<
	NonHashedFileEntry,
	'remoteUrl'
> & {
	status: CatalogFileEntryStatus;
};

/**
 * The metadata for games as stored in Toryalai1's db
 * https://github.com/Toryalai1/MiSTer_ArcadeDatabase/tree/db
 */
export type GameMetadata = {
	manufacturer: string[];
	category: string[];
	series: string[];
	platform: string[];
	move_inputs: string[];
	special_controls: string[];
	alternative: boolean;
	bootleg: boolean;
	flip: boolean;
	rotation: 0 | 90 | 270 | null;
	num_buttons: number | null;
	players: string | null;
	region: string | null;
	resolution: string | null;
};

export type MetadataDB = Record<string, GameMetadata>;

/**
 * The full local representation of a Mister arcade game. Has
 * all of the metadata and info on all of its files
 */
export type CatalogEntry = GameMetadata & {
	db_id: string;
	romSlug: string | null;
	gameName: string;
	yearReleased: number | null;
	mameVersion?: string;
	titleScreenshotUrl: string | null;
	gameplayScreenshotUrl: string | null;
	files: {
		mra: HashedCatalogFileEntry;
		rbf?: HashedCatalogFileEntry;
		roms: NonHashedCatalogFileEntry[];
	};
};

/**
 * All of the local files that AMMister knows about.
 *
 * Since it is indexed by db_id, it can also represent
 * a subcatalog by only having some dbs in it
 */
export type Catalog = {
	updatedAt: number;
} & Record<string, CatalogEntry[]>;

export type UpdateError = {
	type: 'connect-fail' | 'file-error' | 'network-error' | 'unknown';
	fileEntry?: FileEntry;
	message?: string;
};

/**
 * The status of an ongoing "check for updates".
 * Used to report to the use through the UI's modal
 */
export type UpdateStatus = {
	message: string;
	complete?: boolean;
	fresh?: boolean;
	catalog?: Catalog;
	updates?: Update[];
	error?: UpdateError;
	duration?: number;
	canceled?: boolean;
};

// return true to keep going, false to cancel
// TODO: is this still true? Don't we now throw on cancel?
export type UpdateCallback = (status: UpdateStatus) => boolean;
