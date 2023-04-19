import { UpdateDbConfig } from './types';

const defaultUpdateDbs: UpdateDbConfig[] = [
	{
		db_id: 'distribution_mister',
		displayName: 'MiSTer Main',
		url: 'https://raw.githubusercontent.com/MiSTer-devel/Distribution_MiSTer/main/db.json.zip',
		enabled: true,
	},
	{
		db_id: 'jtcores',
		displayName: 'Jotego',
		url: 'https://raw.githubusercontent.com/jotego/jtcores_mister/main/jtbindb.json.zip',
		enabled: true,
	},
	{
		db_id: 'atrac17_Coin-Op_Collection',
		displayName: 'Atrac17: Coin Op Collection',
		url: 'https://raw.githubusercontent.com/atrac17/Coin-Op_Collection/db/db.json.zip',
		enabled: true,
	},
	{
		db_id: 'theypsilon_unofficial_distribution',
		displayName: 'The Ypsilon Unofficial',
		url: 'https://raw.githubusercontent.com/theypsilon/Distribution_Unofficial_MiSTer/main/unofficialdb.json.zip',
		enabled: true,
	},
	{
		db_id: 'arcade_offset_folder',
		displayName: 'Atrac17: Arcade Offset',
		url: 'https://raw.githubusercontent.com/atrac17/Arcade_Offset/db/arcadeoffsetdb.json.zip',
		enabled: true,
		isDependent: true,
	},
];

export { defaultUpdateDbs };
