import React from 'react';
import { Meta } from '@storybook/react';
import { Catalog } from './Catalog';
import type {
	Catalog as CatalogType,
	CatalogEntry as CatalogEntryType,
} from '../../../../main/catalog/types';

const meta: Meta = {
	title: 'Catalog',
	component: Catalog,
};

export default meta;

const completeEntry: CatalogEntryType = {
	db_id: 'jtcores',
	gameName: 'Street Fighter Alpha 2 (Euro 960229)',
	category: 'Fighting',
	rom: 'sfa2',
	titleScreenshotUrl:
		'https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/titles/sfa2.png',
	gameplayScreenshotUrl:
		'https://raw.githubusercontent.com/city41/AMMiSTer/main/screenshots/snap/sfa2.png',
	mameVersion: '0229',
	manufacturer: ['Capcom'],
	orientation: 'horizontal',
	yearReleased: 1996,
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

// @ts-expect-error
const catalog: CatalogType = {
	updatedAt: Date.now(),
	jtcores: [completeEntry, completeEntry],
};

export const Basic = () => {
	return (
		<div style={{ width: 240 }}>
			<Catalog catalog={catalog} />
		</div>
	);
};
