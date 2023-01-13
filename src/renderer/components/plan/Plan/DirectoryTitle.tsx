import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useDrop } from 'react-dnd';
import { TreeItem } from 'react-sortable-tree';
import { Input } from '../../Input';
import { PlanTreeItem } from './types';
import { FolderIcon, FolderOpenIcon } from '../../../icons';

type DirectoryTitleProps = {
	node: TreeItem<PlanTreeItem>;
	onPlanRename: (newName: string) => void;
	onDirectoryRename: (args: {
		parentPath: string[];
		name: string;
		newName: string;
	}) => void;
	onSetFocusedId: (focusedId: string) => void;
	onItemAdd: (args: {
		parentPath: string[];
		db_id: string;
		mraFileName: string;
	}) => void;
};

function DirectoryTitle({
	node,
	onPlanRename,
	onDirectoryRename,
	onSetFocusedId,
	onItemAdd,
}: DirectoryTitleProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [isEditing, setIsEditing] = useState(false);

	const [{ isDraggingOver }, dropRef] = useDrop(() => {
		return {
			accept: 'CatalogEntry',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			drop(item: any) {
				onItemAdd({
					parentPath: node.parentPath.concat(node.title as string),
					db_id: item.node.db_id,
					mraFileName: item.node.mraFileName,
				});
				onSetFocusedId(node.parentPath.concat(node.title as string).join('/'));
			},
			collect(monitor) {
				return {
					isDraggingOver: !!monitor.isOver(),
				};
			},
		};
	}, []);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isEditing]);

	const titleEl = isEditing ? (
		<Input
			ref={inputRef}
			className="border-none font-medium"
			value={node.title as string}
			size={(node.title as string).length}
			onChange={(e) => {
				if (node.parentPath.length === 0) {
					// TODO: can the plan itself not be handled separately?
					onPlanRename(e.target.value);
				} else {
					const newName = e.target.value;
					onDirectoryRename({
						parentPath: node.parentPath,
						name: node.title as string,
						newName,
					});
					onSetFocusedId(node.parentPath.concat(newName).join('/'));
				}
			}}
			onBlur={() => setIsEditing(false)}
		/>
	) : (
		<div
			onClick={() => {
				setIsEditing(true);
			}}
		>
			<div
				ref={dropRef}
				className={clsx({
					'transform scale-105': isDraggingOver,
				})}
			>
				{node.title}
			</div>
		</div>
	);

	const Icon = node.expanded ? FolderOpenIcon : FolderIcon;

	return (
		<div
			className="flex flex-row items-center gap-x-2"
			onClick={() => onSetFocusedId(node.id)}
		>
			<Icon className="w-6 h-6" />
			{titleEl}
			<div className="text-sm font-normal text-gray-500">
				{node.immediateGameCount} / {node.totalGameCount} games
			</div>
		</div>
	);
}

export { DirectoryTitle };
