import React from 'react';
import { useDrag } from 'react-dnd';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../../store';
import { setDetailEntry } from '../catalogSlice';
import { toggleFavorite } from '../../plan/planSlice';
import { CatalogEntry, PublicCatalogEntryProps } from './CatalogEntry';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
} from '../../../../main/plan/types';

function isInPlanDir(dir: PlanGameDirectory, mra: string): boolean {
	for (const e of dir) {
		if ('gameName' in e && e.files.mra.fileName === mra) {
			return true;
		}
		if ('directoryName' in e) {
			const inSubDir = isInPlanDir(e.games, mra);
			if (inSubDir) {
				return true;
			}
		}
	}

	return false;
}

function isPlanFavorite(
	plan: Plan | null | undefined,
	mra: string
): boolean | undefined {
	if (!plan) {
		return undefined;
	}

	const favoriteDir = plan.games.find((e) => {
		return (
			'directoryName' in e && e.directoryName.toLowerCase() === 'favorites'
		);
	});

	if (!favoriteDir) {
		return false;
	}

	return (favoriteDir as PlanGameDirectoryEntry).games.some((e) => {
		if ('gameName' in e && e.files.mra.fileName === mra) {
			return true;
		}
	});
}

function ConnectedCatalogEntry(props: PublicCatalogEntryProps) {
	const [_collected, dragRef] = useDrag(
		() => ({
			type: 'CatalogEntry',
			item: {
				node: {
					// @ts-expect-error
					title: props.entry?.gameName ?? props.title,
					db_id: props.entry?.db_id,
					mraFileName: props.entry?.files.mra.fileName,
				},
			},
		}),
		[]
	);

	const plan = useSelector((state: AppState) => {
		return state.plan.present.plan;
	});

	const settings = useSelector((state: AppState) => {
		return state.settings.settings;
	});

	function handleClick() {
		dispatch(setDetailEntry(props.entry));
	}

	const mra = props.entry?.files.mra.fileName;
	const isInPlan = !!mra && !!plan && isInPlanDir(plan.games, mra);
	const isFavorite = !!mra && isPlanFavorite(plan, mra);

	function handleToggleFavorite() {
		dispatch(toggleFavorite(props.entry));
	}

	return (
		<div ref={dragRef}>
			{' '}
			<CatalogEntry
				{...props}
				onClick={handleClick}
				isInPlan={isInPlan}
				isFavorite={isFavorite}
				downloadingRoms={!!settings?.downloadRoms}
				onToggleFavorite={handleToggleFavorite}
			/>
		</div>
	);
}

export { ConnectedCatalogEntry };
