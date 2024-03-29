import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Meta } from '@storybook/react';
import { ResolveMissingGames } from './ResolveMissingGames';
import { mockCatalogEntry } from '../../catalog/mockCatalogEntry';
import { MissingGameToResolve } from './ResolveMissingGameEntry';
import { defaultUpdateDbs } from '../../../../main/settings/defaultUpdateDbs';

const meta: Meta = {
	title: 'ResolveMissingGames',
	component: ResolveMissingGames,
};

export default meta;

// @ts-expect-error
const catalog: CatalogType = {
	updatedAt: Date.now(),
	jtcores: [mockCatalogEntry, mockCatalogEntry],
};

export const NoMissingGames = () => {
	return (
		<DndProvider backend={HTML5Backend}>
			<ResolveMissingGames
				catalog={catalog}
				missingGames={[]}
				disabledDbsCausingMissingGames={[]}
				onOkay={() => {}}
				onCancel={() => {}}
				onMissingGamesUpdated={() => {}}
			/>
		</DndProvider>
	);
};

export const OneMissingGame = () => {
	const missingGame: MissingGameToResolve = {
		db_id: 'jtcores',
		mraPath: '_Arcade/Street Fighter Alpha 2.mra',
		planPath: 'Fighters',
		potentialReplacements: [
			{ ...mockCatalogEntry, gameName: 'Street Fighter Alpha 3 (Euro 980904)' },
			{ ...mockCatalogEntry, gameName: 'Street Fighter Alpha (Euro 980904)' },
			{
				...mockCatalogEntry,
				gameName: 'Street Fighter II: The World Warrior (World 910522)',
			},
		],
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<ResolveMissingGames
				catalog={catalog}
				missingGames={[missingGame]}
				disabledDbsCausingMissingGames={[]}
				onOkay={() => {}}
				onCancel={() => {}}
				onMissingGamesUpdated={() => {}}
			/>
		</DndProvider>
	);
};

export const FourMissingGames = () => {
	const missingGame1: MissingGameToResolve = {
		db_id: 'jtcores',
		mraPath: '_Arcade/Street Fighter Alpha 2_1.mra',
		planPath: 'Fighters',
		potentialReplacements: null,
	};

	const missingGame2: MissingGameToResolve = {
		db_id: 'jtcores',
		mraPath: '_Arcade/Street Fighter Alpha 2_2.mra',
		planPath: 'Fighters/Capcom',
		potentialReplacements: [
			{
				...mockCatalogEntry,
				gameName: 'Street Fighter II: The World Warrior (World 910522)',
			},
			mockCatalogEntry,
		],
		replacementChoice: 'entry',
		replacementEntry: mockCatalogEntry,
	};

	const missingGame3: MissingGameToResolve = {
		db_id: 'jtcores',
		mraPath: '_Arcade/Street Fighter Alpha 2_3.mra',
		planPath: 'Fighters/Capcom',
		potentialReplacements: [mockCatalogEntry],
		replacementChoice: 'remove',
	};

	const missingGame4: MissingGameToResolve = {
		db_id: 'jtcores',
		mraPath: '_Arcade/Street Fighter Alpha 2_4.mra',
		planPath: 'Fighters/Capcom/2D',
		potentialReplacements: [
			{
				...mockCatalogEntry,
				gameName: 'Street Fighter II: The World Warrior (World 910522)',
			},
		],
		replacementChoice: 'drop',
		replacementEntry: mockCatalogEntry,
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<ResolveMissingGames
				catalog={catalog}
				missingGames={[missingGame1, missingGame2, missingGame3, missingGame4]}
				disabledDbsCausingMissingGames={[]}
				onOkay={() => {}}
				onCancel={() => {}}
				onMissingGamesUpdated={() => {}}
			/>
		</DndProvider>
	);
};

export const DisabledDatabases = () => {
	const missingGame: MissingGameToResolve = {
		db_id: 'jtcores',
		mraPath: '_Arcade/Street Fighter Alpha 2.mra',
		planPath: 'Fighters',
		potentialReplacements: [
			{ ...mockCatalogEntry, gameName: 'Street Fighter Alpha 3 (Euro 980904)' },
			{ ...mockCatalogEntry, gameName: 'Street Fighter Alpha (Euro 980904)' },
			{
				...mockCatalogEntry,
				gameName: 'Street Fighter II: The World Warrior (World 910522)',
			},
		],
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<ResolveMissingGames
				catalog={catalog}
				missingGames={[missingGame]}
				disabledDbsCausingMissingGames={defaultUpdateDbs}
				onOkay={() => {}}
				onCancel={() => {}}
				onMissingGamesUpdated={() => {}}
			/>
		</DndProvider>
	);
};
