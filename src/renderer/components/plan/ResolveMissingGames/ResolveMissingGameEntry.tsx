import React from 'react';
import clsx from 'clsx';
import { CatalogEntry } from '../../../../main/catalog/types';
import { CheckIcon } from '../../../icons';

type MissingGameToResolve = {
	mraPath: string;
	planPath: string;
	potentialReplacements:
		| [CatalogEntry]
		| [CatalogEntry, CatalogEntry]
		| [CatalogEntry, CatalogEntry, CatalogEntry]
		| null;
	replacementChoice?: 'entry' | 'remove';
	replacementEntry?: CatalogEntry;
};

type ResolveMissingGameEntryProps = {
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
				'border px-4 py-2 flex flex-col border-gray-300 cursor-pointer',
				{
					'border-4 border-green-700': isChosen,
					'hover:bg-green-100': !isChosen,
				}
			)}
			onClick={onClick}
		>
			<div
				className={clsx('text-xs text-center mb-4 border-b border-gray-400')}
			>
				replace with
			</div>
			<div>{gameName}</div>
		</div>
	);
}

function ResolveMissingGameEntry({
	missingGame,
	minimizeIfResolved,
	onChange,
}: ResolveMissingGameEntryProps) {
	const icon = missingGame.replacementChoice ? (
		<CheckIcon className="text-green-700 w-6" />
	) : null;

	const choseOwnGame =
		missingGame.replacementChoice === 'entry' &&
		!!missingGame.replacementEntry &&
		!missingGame.potentialReplacements?.includes(missingGame.replacementEntry);

	return (
		<div
			className={clsx(
				'flex flex-col gap-y-4 items-start border px-4 py-2 shadow-lg border-gray-200',
				{ 'opacity-50': !!missingGame.replacementChoice }
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
				<div className="grid grid-cols-5 gap-x-3">
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
									}
								}}
							/>
						);
					})}
					<div
						style={{ gridColumn: 4 }}
						className={clsx(
							'border-2 border-red-200 grid place-items-center text-sm cursor-pointer',
							{
								'border-4 border-red-600 text-red-600':
									missingGame.replacementChoice === 'remove',
								'hover:bg-red-100': missingGame.replacementChoice !== 'remove',
							}
						)}
						onClick={() => {
							if (missingGame.replacementChoice !== 'remove') {
								onChange({
									...missingGame,
									replacementEntry: undefined,
									replacementChoice: 'remove',
								});
							}
						}}
					>
						remove
					</div>
					<div
						className={clsx(
							'hidden border-2 border-dashed border-gray-200 xgrid place-items-center text-sm px-2',
							{
								'border-green-700': choseOwnGame,
							}
						)}
						style={{ gridColumn: 5 }}
					>
						{choseOwnGame ? (
							<GameEntry
								gameName={missingGame.replacementEntry!.gameName}
								isChosen
							/>
						) : (
							<>or, drag a game here</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export { ResolveMissingGameEntry };
export type { MissingGameToResolve };
