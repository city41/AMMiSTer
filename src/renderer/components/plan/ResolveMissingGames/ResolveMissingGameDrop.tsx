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
				'flex flex-row items-center gap-x-2 p-2 border-4 border-dashed text-xs transition-all',
				{
					'border-gray-200 ml-4': !entry,
					'border-green-700': entry,
				}
			)}
		>
			<div
				style={{ marginLeft: 'calc(-.5rem - 1px)' }}
				className={clsx(
					'text-xs px-2 py-1 text-white w-24 h-8 grid place-items-center',
					{
						'bg-green-700': entry,
						'bg-gray-500': !entry,
					}
				)}
			>
				replace with
			</div>
			{entry ? (
				entry.gameName
			) : (
				<span className="italic">drag a game from the left here</span>
			)}
		</div>
	);
}

export { ResolveMissingGameDrop };
