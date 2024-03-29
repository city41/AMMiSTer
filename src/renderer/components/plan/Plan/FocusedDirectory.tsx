import React, { CSSProperties } from 'react';
import clsx from 'clsx';
import { useDrop } from 'react-dnd';
import { TreeItem } from 'react-sortable-tree';
import { PlanTreeItem } from './types';
import { CatalogEntry } from '../../catalog/CatalogEntry';
import { TrashIcon } from '../../../icons';
import { DirectoryEntry } from './DirectoryEntry';
import { UpdateDbConfig } from '../../../../main/settings/types';
import { Catalog as CatalogType } from '../../../../main/catalog/types';
import { getCatalogEntryForMraPath } from '../../../../main/catalog/util';
import { MissingEntry } from './MissingEntry';

type FocusedDirectoryProps = {
	className?: string;
	style?: CSSProperties;
	focusedNode: TreeItem<PlanTreeItem>;
	catalog: CatalogType;
	updateDbConfigs: UpdateDbConfig[];
	planName: string;
	onItemAdd: (args: {
		parentPath: string[];
		db_id: string;
		mraFileName: string;
	}) => void;
	onBulkAdd: (planPath: string) => void;
	onBulkRemoveMissing: (args: { parentPath: string[] }) => void;
	onItemDelete: (args: { parentPath: string[]; name: string }) => void;
};

function FocusedDirectory({
	className,
	style,
	focusedNode,
	catalog,
	updateDbConfigs,
	planName,
	onItemAdd,
	onBulkAdd,
	onBulkRemoveMissing,
	onItemDelete,
}: FocusedDirectoryProps) {
	const focusedId = focusedNode.id;

	// TODO: can the plan name be lopped off cleaner?
	// or can we just use focusedNode.parentPath?
	const planPath = focusedId.replace(new RegExp(`^/?${planName}/?`), '');

	const [{ isDraggingOver, draggedTitle }, dropRef] = useDrop(() => {
		return {
			accept: 'CatalogEntry',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			drop(item: any) {
				onItemAdd({
					parentPath: focusedId.replace(/^\//, '').split('/'),
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
	}, [focusedId]);

	return (
		<div
			className={clsx(
				className,
				'-my-4 border-l border-l-gray-200 pr-0 overflow-y-auto flex flex-col'
			)}
			style={style}
		>
			<h2 className="flex flex-col gap-y-1 items-start py-2 pl-4 font-bold sticky top-0 z-40 bg-indigo-50 text-indigo-600 border-b border-t border-b-indigo-500 border-t-indigo-500 first:border-t-transparent">
				<div className="font-medium text-lg flex flex-row items-baseline gap-x-2">
					<div>{focusedNode.title}</div>
					{focusedNode.immediateGameCount > 0 && (
						<div className="font-normal text-sm text-gray-500">
							{focusedNode.immediateGameCount} game
							{focusedNode.immediateGameCount === 1 ? '' : 's'}
						</div>
					)}
				</div>
				<a
					className="text-blue-600 text-sm underline cursor-pointer"
					onClick={() => onBulkAdd(planPath)}
				>
					bulk add games
				</a>
				{focusedNode.immediateMissingGameCount > 0 && (
					<a
						className="text-red-600 text-sm underline cursor-pointer"
						onClick={() => {
							onBulkRemoveMissing({
								parentPath: focusedNode.parentPath.concat(
									focusedNode.title as string
								),
							});
						}}
					>
						Remove {focusedNode.immediateMissingGameCount === 1 ? 'the' : 'all'}{' '}
						{focusedNode.immediateMissingGameCount} missing game
						{focusedNode.immediateMissingGameCount === 1 ? '' : 's'}
					</a>
				)}
			</h2>
			<div className="relative h-full" ref={dropRef}>
				<ul className="flex flex-col">
					{focusedNode.entries.map((g, i) => {
						let el;
						let entryName: string;
						if ('directoryName' in g) {
							entryName = g.directoryName;
							el = <DirectoryEntry className="py-2" directory={g} />;
						} else {
							const catalogEntry = getCatalogEntryForMraPath(
								g.db_id,
								g.relFilePath,
								catalog,
								updateDbConfigs
							);

							if (catalogEntry) {
								entryName = g.relFilePath;
								el = <CatalogEntry entry={catalogEntry} hideInPlan />;
							} else {
								entryName = g.relFilePath;
								el = <MissingEntry entry={{ ...g, missing: true }} />;
							}
						}

						return (
							<li
								key={i.toString() + entryName}
								className="pl-4 pr-2 py-1 even:bg-gray-50 border border-b-gray-200 grid gap-x-2 items-center group"
								style={{
									gridTemplateColumns: 'minmax(0, 1fr) max-content',
								}}
							>
								{el}
								<TrashIcon
									className="w-5 h-5 cursor-pointer invisible group-hover:visible"
									onClick={() => {
										const parentPath = focusedNode.parentPath.concat(
											focusedNode.title as string
										);
										onItemDelete({ parentPath, name: entryName });
									}}
								/>
							</li>
						);
					})}
					<li className="flex-1 bg-white" />
				</ul>
				{focusedNode.immediateGameCount === 0 && (
					<div className="text-sm italic text-gray-600 ml-4 my-8">
						This folder has no games
					</div>
				)}
				{isDraggingOver && (
					<>
						<div className="absolute inset-0 bg-white opacity-90" />
						<div className="absolute inset-0 flex flex-row justify-center xitems-center gap-x-2 mt-32 font-medium">
							<div>add {draggedTitle}</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

export { FocusedDirectory };
