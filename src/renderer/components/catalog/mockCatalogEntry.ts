import { CatalogEntry } from '../../../main/catalog/types';

const mockCatalogEntry: CatalogEntry = {
	db_id: 'jtcores',
	romSlug: 'sfa2',
	gameName: 'Street Fighter Alpha 2 (Euro 960229)',
	category: ['Fighter - Versus'],
	titleScreenshotUrl:
		'https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/titles/sfa2.png',
	gameplayScreenshotUrl:
		'https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/snap/sfa2.png',
	shortPlayVideoId: 'hh2-x8o7Jgc',
	arcadeItaliaRating: 90,
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
			dbRelFilePath: '_Arcade/Street Fighter 2 (Euro 960229).mra',
			relFilePath: '_Arcade/Street Fighter 2 (Euro 960229).mra',
			status: 'ok',
			size: 123,
		},
		rbf: {
			type: 'rbf',
			db_id: 'jtcores',
			fileName: 'jtcps2_20220819.rbf',
			md5: 'dummy hash',
			dbRelFilePath: '_Arcade/cores/jtcps2_20220819.rbf',
			relFilePath: '_Arcade/cores/jtcps2_20220819.rbf',
			status: 'ok',
			size: 456,
		},
		roms: [
			{
				type: 'rom',
				db_id: 'jtcores',
				fileName: 'sfa2.zip',
				relFilePath: 'games/mame/sfa2.zip',
				status: 'ok',
				size: 789,
			},
			{
				type: 'rom',
				db_id: 'jtcores',
				fileName: 'qsound.zip',
				relFilePath: 'games/mame/qsound.zip',
				status: 'ok',
				size: 789,
			},
		],
	},
};

export { mockCatalogEntry };
