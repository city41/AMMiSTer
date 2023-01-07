import React from 'react';
import { useDrag } from 'react-dnd';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../../store';
import { setDetailEntry } from '../catalogSlice';
import { CatalogEntry, PublicCatalogEntryProps } from './CatalogEntry';
import { PlanGameDirectory } from '../../../../main/plan/types';

function isInPlanDir(dir: PlanGameDirectory, mra: string) {
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

function ConnectedCatalogEntry(props: PublicCatalogEntryProps) {
	const [_collected, dragRef] = useDrag(
		() => ({
			type: 'CatalogEntry',
			item: {
				node: {
					title: props.entry.gameName,
					db_id: props.entry.db_id,
					mraFileName: props.entry.files.mra.fileName,
				},
			},
		}),
		[]
	);

	const plan = useSelector((state: AppState) => {
		return state.plan.present.plan;
	});

	function handleClick() {
		dispatch(setDetailEntry(props.entry));
	}

	const mra = props.entry.files.mra.fileName;
	const isInPlan = !!plan && isInPlanDir(plan.games, mra);

	return (
		<div ref={dragRef}>
			{' '}
			<CatalogEntry {...props} onClick={handleClick} isInPlan={isInPlan} />
		</div>
	);
}

export { ConnectedCatalogEntry };
