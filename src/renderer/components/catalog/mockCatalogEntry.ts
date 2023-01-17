import { CatalogEntry } from '../../../main/catalog/types';

const mockCatalogEntry: CatalogEntry = {
	db_id: 'jtcores',
	romSlug: 'sfa2',
	gameName: 'Street Fighter Alpha 2 (Euro 960229)',
	categories: ['Fighter - Versus'],
	titleScreenshotUrl:
		'https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/titles/sfa2.png',
	gameplayScreenshotUrl:
		'https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/snap/sfa2.png',
	mameVersion: '0229',
	manufacturer: ['Capcom'],
	yearReleased: 1996,
	alternative: false,
	bootleg: false,
	flip: false,
	num_buttons: 6,
	players: '2 (simultaneous)',
	region: 'Europe',
	resolution: '15kHz',
	rotation: 0,
	series: ['Street Fighter'],
	move_inputs: ['8-way'],
	platform: ['Capcom CPS-2'],
	special_controls: [],
	files: {
		mra: {
			type: 'mra',
			db_id: 'jtcores',
			fileName: 'Street Fighter Alpha 2 (Euro 960229).mra',
			md5: 'dummy hash',
			relFilePath: '_Arcade/Street Fighter 2 (Euro 960229).mra',
		},
		rbf: {
			type: 'rbf',
			db_id: 'jtcores',
			fileName: 'jtcps2_20220819.rbf',
			md5: 'dummy hash',
			relFilePath: '_Arcade/cores/jtcps2_20220819.rbf',
		},
		roms: [
			{
				type: 'rom',
				db_id: 'jtcores',
				fileName: 'sfa2.zip',
				md5: 'dummy hash',
				relFilePath: 'games/mame/sfa2.zip',
			},
			{
				type: 'rom',
				db_id: 'jtcores',
				fileName: 'qsound.zip',
				md5: 'dummy hash',
				relFilePath: 'games/mame/qsound.zip',
			},
		],
	},
};

export { mockCatalogEntry };
