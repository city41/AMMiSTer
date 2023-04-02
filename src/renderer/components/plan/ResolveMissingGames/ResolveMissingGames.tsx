import React, { useState } from 'react';
import clsx from 'clsx';
import Toggle from 'react-toggle';
import { Button } from '../../Button';
import {
	MissingGameToResolve,
	ResolveMissingGameEntry,
} from './ResolveMissingGameEntry';
import { DangerIcon } from '../../../icons';

type InternalResolveMissingGamesProps = {
	missingGames: MissingGameToResolve[];
	onMissingGamesUpdated: (newMissingGames: MissingGameToResolve[]) => void;
	onOkay: () => void;
	onCancel: () => void;
};

type PublicResolveMissingGamesProps = {
	className?: string;
};

function ResolveMissingGames({
	className,
	missingGames,
	onMissingGamesUpdated,
	onOkay,
	onCancel,
}: PublicResolveMissingGamesProps & InternalResolveMissingGamesProps) {
	const [minimizeResolved, setMinimizeResolved] = useState(false);

	let decideText = '';
	const toBeDecidedCount = missingGames.filter(
		(mg) => !mg.replacementChoice
	).length;

	if (toBeDecidedCount > 0) {
		if (toBeDecidedCount === missingGames.length) {
			decideText = `Decide what to do with ${
				missingGames.length === 1 ? 'it' : 'them'
			}`;
		} else {
			decideText = `Decide what to do with the remaining ${
				toBeDecidedCount === 1 ? '' : toBeDecidedCount.toString()
			} game${toBeDecidedCount === 1 ? '' : 's'}`;
		}
	}

	return (
		<div
			style={{
				maxWidth: 1300,
			}}
			className={clsx(
				className,
				'h-full w-full flex flex-col gap-y-8 px-6 py-5'
			)}
		>
			<div className="flex flex-row gap-x-2 items-center">
				<div>
					<div className="px-2 py-2 bg-yellow-50 text-yellow-700 flex flex-row gap-x-2">
						<DangerIcon className="w-6 text-red-700" />
						This is a new, and unfinished feature
					</div>
					<h1 className="text-lg font-medium leading-6 text-gray-900">
						There {missingGames.length === 1 ? 'is' : 'are'}{' '}
						{missingGames.length} missing game
						{missingGames.length === 1 ? '' : 's'}
					</h1>
					{toBeDecidedCount > 0 && (
						<p className="mt-2 text-sm text-gray-600">{decideText}</p>
					)}
				</div>
				<div className="flex-1" />
				<Toggle
					id="hide-resolved"
					onChange={() => setMinimizeResolved((hr) => !hr)}
					checked={!!minimizeResolved}
				/>
				<label htmlFor="hide-resolved" className="text-xs text-gray-600">
					Minimized Resolved Games
				</label>
			</div>
			<ul className="flex flex-col overflow-y-auto">
				{missingGames.map((mg) => {
					return (
						<li
							key={`${mg.mraPath}-${mg.planPath}`}
							className={clsx({
								'mb-16': !minimizeResolved || !mg.replacementChoice,
							})}
						>
							<ResolveMissingGameEntry
								missingGame={mg}
								minimizeIfResolved={minimizeResolved}
								onChange={(changedMg) => {
									const newMgs = missingGames.map((omg) => {
										if (
											omg.mraPath === changedMg.mraPath &&
											omg.planPath === changedMg.planPath
										) {
											return changedMg;
										} else {
											return omg;
										}
									});

									onMissingGamesUpdated(newMgs);
								}}
							/>
						</li>
					);
				})}
			</ul>
			<div className="flex flex-row justify-end gap-x-2 px-2 py-4 mt-8 border-t border-t-gray-400">
				<Button variant="danger" onClick={onCancel}>
					Cancel
				</Button>
				<Button onClick={onOkay}>Okay</Button>
			</div>
		</div>
	);
}

export { ResolveMissingGames };
export type { PublicResolveMissingGamesProps };
