import React from 'react';
import clsx from 'clsx';
import { Catalog, CatalogEntry } from '../../../../main/catalog/types';
import { CheckIcon } from '../../../icons';
import { ResolveMissingGameDrop } from './ResolveMissingGameDrop';

type MissingGameToResolve = {
	db_id: string;
	mraPath: string;
	planPath: string;
	potentialReplacements:
		| [CatalogEntry]
		| [CatalogEntry, CatalogEntry]
		| [CatalogEntry, CatalogEntry, CatalogEntry]
		| null;
	replacementChoice?: 'entry' | 'drop' | 'remove';
	replacementEntry?: CatalogEntry;
	owningDisabledDbDisplayName?: string;
};

type ResolveMissingGameEntryProps = {
	catalog: Catalog;
	missingGame: MissingGameToResolve;
	minimizeIfResolved?: boolean;
	onChange: (newMg: MissingGameToResolve) => void;
};

type GameEntryProps = {
	gameName: string;
	onClick?: () => void;
	isChosen: boolean;
};

function mraPathToTitle(p: string): string {
	return p.replace('_Arcade/', '').replace('_Arcade\\', '');
}

function GameEntry({ gameName, onClick, isChosen }: GameEntryProps) {
	return (
		<div
			className={clsx(
				'border-4 px-2 py-2 flex flex-row items-center gap-x-2 border-gray-300 cursor-pointer',
				{
					'border-green-700': isChosen,
					'hover:bg-green-100 border-gray-300': !isChosen,
				}
			)}
			onClick={onClick}
		>
			<div
				style={{ marginLeft: 'calc(-.5rem - 1px)' }}
				className={clsx(
					'text-xs px-2 py-1 bg-gray-500 text-white w-24 h-8 grid place-items-center',
					{
						'bg-green-700': isChosen,
						'bg-gray-500': !isChosen,
					}
				)}
			>
				replace with
			</div>
			<div>{gameName}</div>
		</div>
	);
}

function ResolveMissingGameEntry({
	catalog,
	missingGame,
	minimizeIfResolved,
	onChange,
}: ResolveMissingGameEntryProps) {
	const icon = missingGame.replacementChoice ? (
		<CheckIcon className="text-green-700 w-6" />
	) : null;

	return (
		<div
			className={clsx(
				'flex flex-col gap-y-4 items-start border px-4 py-2 shadow-lg border-gray-200'
			)}
		>
			<div
				className={clsx(
					'px-2 py-1 -ml-4 -mr-8 -my-2 bg-gray-200 flex flex-row gap-x-2',
					{ 'font-bold': !missingGame.replacementChoice }
				)}
				style={{ width: 'calc(100% + 2rem)' }}
			>
				{mraPathToTitle(missingGame.mraPath)}
				{icon}
				<div className="flex-1" />
				<div className="font-normal text-sm italic text-gray-700">
					{missingGame.planPath}
				</div>
			</div>
			{(!minimizeIfResolved || !missingGame.replacementChoice) && (
				<div className="w-full flex flex-col items-stretch gap-y-2">
					{missingGame.owningDisabledDbDisplayName && (
						<div className="text-sm text-red-600">
							The database this game came from,{' '}
							{missingGame.owningDisabledDbDisplayName}, has been disabled.
						</div>
					)}
					{missingGame.potentialReplacements?.map((pr) => {
						return (
							<GameEntry
								key={pr.files.mra.relFilePath}
								gameName={pr.gameName}
								isChosen={missingGame.replacementEntry === pr}
								onClick={() => {
									if (missingGame.replacementEntry !== pr) {
										onChange({
											...missingGame,
											replacementEntry: pr,
											replacementChoice: 'entry',
										});
									} else {
										onChange({
											...missingGame,
											replacementEntry: undefined,
											replacementChoice: undefined,
										});
									}
								}}
							/>
						);
					})}
					<ResolveMissingGameDrop
						className="px-4 h-8 w-60 grid place-items-center border-4"
						entry={
							missingGame.replacementChoice === 'drop'
								? missingGame.replacementEntry
								: undefined
						}
						onGameChosen={({ db_id, mraFileName }) => {
							const db = catalog[db_id];

							const entry = db.find(
								(e) => e.files.mra.fileName === mraFileName
							);

							if (entry) {
								onChange({
									...missingGame,
									replacementEntry: entry,
									replacementChoice: 'drop',
								});
							}
						}}
					/>
					<div
						className={clsx(
							'border-4 grid place-items-center text-xs cursor-pointer self-start px-4 h-8 w-60',
							{
								'border-red-600 bg-red-600 text-white':
									missingGame.replacementChoice === 'remove',
								'border-red-100 hover:bg-red-100':
									missingGame.replacementChoice !== 'remove',
							}
						)}
						onClick={() => {
							if (missingGame.replacementChoice !== 'remove') {
								onChange({
									...missingGame,
									replacementEntry: undefined,
									replacementChoice: 'remove',
								});
							} else {
								onChange({
									...missingGame,
									replacementEntry: undefined,
									replacementChoice: undefined,
								});
							}
						}}
					>
						remove
					</div>
				</div>
			)}
		</div>
	);
}

export { ResolveMissingGameEntry };
export type { MissingGameToResolve };
