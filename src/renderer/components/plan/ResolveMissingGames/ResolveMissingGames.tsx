import React, { useState } from 'react';
import clsx from 'clsx';
import Toggle from 'react-toggle';
import { Button } from '../../Button';
import {
	MissingGameToResolve,
	ResolveMissingGameEntry,
} from './ResolveMissingGameEntry';
import { Catalog } from '../../../../main/catalog/types';
import { UpdateDbConfig } from '../../../../main/settings/types';

type InternalResolveMissingGamesProps = {
	missingGames: MissingGameToResolve[];
	disabledDbsCausingMissingGames: UpdateDbConfig[];
	catalog: Catalog;
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
	disabledDbsCausingMissingGames,
	catalog,
	onMissingGamesUpdated,
	onOkay,
	onCancel,
}: PublicResolveMissingGamesProps & InternalResolveMissingGamesProps) {
	const [minimizeResolved, setMinimizeResolved] = useState(false);

	const toBeDecidedCount = missingGames.filter(
		(mg) => !mg.replacementChoice
	).length;

	const [autoDecided, setAutoDecided] = useState(toBeDecidedCount === 0);

	let decideText = '';

	if (toBeDecidedCount > 0) {
		if (toBeDecidedCount === missingGames.length) {
			decideText = `Decide what to do with ${
				missingGames.length === 1 ? 'it.' : 'them.'
			}`;
		} else {
			decideText = `Decide what to do with the remaining ${
				toBeDecidedCount === 1 ? '' : toBeDecidedCount.toString()
			} game${toBeDecidedCount === 1 ? '.' : 's.'}`;
		}
	} else {
		if (autoDecided) {
			decideText =
				'AMMiSTer was able to find replacements for all games. If the choices look good, you can just click okay.';
		} else {
			decideText = 'All missing games have been resolved.';
		}
	}

	return (
		<div
			style={{
				maxWidth: 1300,
			}}
			className={clsx(className, 'h-full w-full flex flex-col xgap-y-8')}
		>
			<div className="flex flex-row gap-x-8 items-center">
				<div>
					<h2 className="text-lg font-medium leading-6 text-gray-900">
						There {missingGames.length === 1 ? 'is' : 'are'}{' '}
						{missingGames.length} missing game
						{missingGames.length === 1 ? '' : 's'}
					</h2>
					<p className="mt-2 text-sm text-gray-600 pt-2 h-20">{decideText}</p>
				</div>
				<div className="flex-1" />
				<Toggle
					id="hide-resolved"
					onChange={() => setMinimizeResolved((hr) => !hr)}
					checked={!!minimizeResolved}
				/>
				<label htmlFor="hide-resolved" className="text-xs text-gray-600">
					Minimize Resolved Games
				</label>
			</div>
			{disabledDbsCausingMissingGames.length > 0 && (
				<div className="mb-8">
					<h2 className="text-lg font-medium leading-6 text-gray-900">
						Disabled DataBases
					</h2>
					<p className="mt-2 text-sm text-gray-600 h-8">
						These databases have been disabled, but games in this plan came from
						them. Try enabling them in settings.
					</p>
					<ul className="list-disc pl-8">
						{disabledDbsCausingMissingGames.map((db) => {
							return (
								<li key={db.db_id} className="text-sm">
									{db.displayName}
								</li>
							);
						})}
					</ul>
				</div>
			)}
			<ul className="flex flex-col overflow-y-auto pr-8">
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
								catalog={catalog}
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
									setAutoDecided(false);
								}}
							/>
						</li>
					);
				})}
			</ul>
			<div className="flex-1" />
			<div className="flex flex-row justify-end -ml-8 gap-x-2 px-2 py-4 border-t border-t-gray-400">
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
