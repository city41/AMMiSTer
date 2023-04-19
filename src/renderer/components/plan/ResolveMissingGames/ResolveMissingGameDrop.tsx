import React from 'react';
import clsx from 'clsx';
import { useDrop } from 'react-dnd';
import { CatalogEntry } from '../../../../main/catalog/types';

type ResolveMissingGameDropProps = {
	className?: string;
	onGameChosen: (args: { db_id: string; mraFileName: string }) => void;
	entry?: CatalogEntry;
};

function ResolveMissingGameDrop({
	className,
	onGameChosen,
	entry,
}: ResolveMissingGameDropProps) {
	// eslint-disable-next-line no-empty-pattern
	const [{}, dropRef] = useDrop(() => {
		return {
			accept: 'CatalogEntry',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			drop(item: any) {
				onGameChosen({
					db_id: item.node.db_id,
					mraFileName: item.node.mraFileName,
				});
			},
			collect(monitor) {
				return {
					isDraggingOver: !!monitor.isOver(),
					draggedTitle: monitor.getItem()?.node.title,
				};
			},
		};
	}, []);

	return (
		<div
			ref={dropRef}
			className={clsx(
				className,
				'border border-dashed border-gray-200 text-xs'
			)}
		>
			{entry ? entry.gameName : 'drag a game from the left here'}
		</div>
	);
}

export { ResolveMissingGameDrop };
