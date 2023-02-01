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

function isInPlanDir(dir: PlanGameDirectory, mraFilePath: string): boolean {
	for (const e of dir) {
		if ('relFiePath' in e && e.relFiePath === mraFilePath) {
			return true;
		}
		if ('directoryName' in e) {
			const inSubDir = isInPlanDir(e.games, mraFilePath);
			if (inSubDir) {
				return true;
			}
		}
	}

	return false;
}

function isPlanFavorite(
	plan: Plan | null | undefined,
	mraFilePath: string
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
		if ('relFilePath' in e && e.relFilePath === mraFilePath) {
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

	const mraFilePath = props.entry?.files.mra.relFilePath;
	const isInPlan =
		!!mraFilePath && !!plan && isInPlanDir(plan.games, mraFilePath);
	const isFavorite = !!mraFilePath && isPlanFavorite(plan, mraFilePath);

	function handleToggleFavorite() {
		dispatch(toggleFavorite(props.entry));
	}

	return (
		<div ref={dragRef}>
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
