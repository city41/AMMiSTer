import React, { useEffect, useState } from 'react';
import { findBestMatch, Rating } from 'string-similarity';
import { Catalog, CatalogEntry } from '../../../../main/catalog/types';
import {
	Plan,
	PlanGameDirectory,
	PlanGameEntry,
} from '../../../../main/plan/types';
import { UpdateDbConfig } from '../../../../main/settings/types';
import { areAllNonDependentDbsEnabled } from '../../../../main/settings/util';
import { getCatalogEntryForMraPath } from '../../../../main/catalog/util';
import { MissingGameToResolve } from './ResolveMissingGameEntry';
import {
	PublicResolveMissingGamesProps,
	ResolveMissingGames,
} from './ResolveMissingGames';
import { resolveMissingGames } from '../planSlice';
import { dispatch } from '../../../store';

type ConnectedResolveMissingGamesProps = PublicResolveMissingGamesProps & {
	plan: Plan;
	catalog: Catalog;
	updateDbConfigs: UpdateDbConfig[];
	onClose: () => void;
};

function getMissingGames(
	dir: PlanGameDirectory,
	catalog: Catalog,
	updateDbConfigs: UpdateDbConfig[],
	rootPath: string
): Array<PlanGameEntry & { planPath: string }> {
	const missingGames: Array<PlanGameEntry & { planPath: string }> = [];

	for (const entry of dir) {
		if ('games' in entry) {
			const subMissingGames = getMissingGames(
				entry.games,
				catalog,
				updateDbConfigs,
				`${rootPath}/${entry.directoryName}`
			);
			missingGames.push(...subMissingGames);
		} else {
			const catalogEntry = getCatalogEntryForMraPath(
				entry.db_id,
				entry.relFilePath,
				catalog,
				updateDbConfigs
			);

			if (!catalogEntry) {
				missingGames.push({
					...entry,
					planPath: rootPath.replace(/^\//, ''),
				});
			}
		}
	}

	return missingGames;
}

function sortMatchesByRating(a: Rating, b: Rating): number {
	return b.rating - a.rating;
}

function getPotentialReplacementGames(
	missingGame: PlanGameEntry,
	availableGames: CatalogEntry[]
):
	| [CatalogEntry]
	| [CatalogEntry, CatalogEntry]
	| [CatalogEntry, CatalogEntry, CatalogEntry]
	| null {
	const availableGamesFromSameDb = availableGames.filter(
		(ag) => ag.db_id === missingGame.db_id
	);
	const availableGamesFromSameDbPaths = availableGamesFromSameDb.map(
		(ag) => ag.files.mra.relFilePath
	);

	const matches = findBestMatch(
		missingGame.relFilePath,
		availableGamesFromSameDbPaths
	);

	const bestMatches = matches.ratings
		.sort(sortMatchesByRating)
		.slice(0, 3)
		.filter((r, i) => {
			return i === 0 || r.rating > 0.65;
		})
		.map((matchedRelFilePath) => {
			return availableGamesFromSameDb.find(
				(ag) => ag.files.mra.relFilePath === matchedRelFilePath.target
			)!;
		});

	if (bestMatches.length === 0) {
		return null;
	}

	return bestMatches as
		| [CatalogEntry]
		| [CatalogEntry, CatalogEntry]
		| [CatalogEntry, CatalogEntry, CatalogEntry];
}

function buildMissingGameEntries(
	plan: Plan,
	catalog: Catalog,
	updateDbConfigs: UpdateDbConfig[]
): MissingGameToResolve[] {
	const missingGames = getMissingGames(
		plan.games,
		catalog,
		updateDbConfigs,
		''
	);
	const { updatedAt, ...restofCatalog } = catalog;
	const availableGames = Object.values(restofCatalog).flat(1);

	const allNonDependentDbsEnabled =
		areAllNonDependentDbsEnabled(updateDbConfigs);

	return missingGames.map((mg) => {
		const updateDb = updateDbConfigs.find((udb) => udb.db_id === mg.db_id);

		// if the update db this game came from has been turned off, we
		// won't be able to find any replacements. Replacements only make sense
		// if they can be exported. No worries, the user will be alerted they
		// have games in this plan from disabled DBs
		const owningDbIsDisabled = !!(
			!updateDb?.enabled ||
			(!allNonDependentDbsEnabled && updateDb?.isDependent)
		);

		const potentialReplacements = owningDbIsDisabled
			? null
			: getPotentialReplacementGames(mg, availableGames);

		return {
			db_id: mg.db_id,
			mraPath: mg.relFilePath,
			planPath: mg.planPath,
			potentialReplacements,
			replacementChoice: potentialReplacements?.length ? 'entry' : undefined,
			replacementEntry: potentialReplacements?.length
				? potentialReplacements[0]
				: undefined,
			owningDisabledDbDisplayName: owningDbIsDisabled
				? updateDb?.displayName
				: undefined,
		};
	});
}

function ConnectedResolveMissingGames({
	plan,
	catalog,
	updateDbConfigs,
	onClose,
	...rest
}: ConnectedResolveMissingGamesProps) {
	const [missingGames, setMissingGames] = useState(
		buildMissingGameEntries(plan, catalog, updateDbConfigs)
	);

	useEffect(() => {
		setMissingGames(buildMissingGameEntries(plan, catalog, updateDbConfigs));
	}, [plan, catalog, updateDbConfigs]);

	const disabledDbs = updateDbConfigs.filter((db) => {
		return !db.enabled && missingGames.some((mg) => mg.db_id === db.db_id);
	});

	function handleOkay() {
		const resolvedGames = missingGames.filter((mg) => !!mg.replacementChoice);

		dispatch(resolveMissingGames(resolvedGames));
		onClose();
	}

	return (
		<ResolveMissingGames
			catalog={catalog}
			missingGames={missingGames}
			disabledDbsCausingMissingGames={disabledDbs}
			onCancel={onClose}
			onOkay={handleOkay}
			onMissingGamesUpdated={(newMissingGames) => {
				setMissingGames(newMissingGames);
			}}
			{...rest}
		/>
	);
}

export { ConnectedResolveMissingGames };
