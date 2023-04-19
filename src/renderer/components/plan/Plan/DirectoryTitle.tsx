import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useDrop } from 'react-dnd';
import { TreeItem } from 'react-sortable-tree';
import { Input } from '../../Input';
import { PlanTreeItem } from './types';
import { FolderIcon } from '../../../icons';

type DirectoryTitleProps = {
	node: TreeItem<PlanTreeItem>;
	isDirty: boolean;
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
	isDirty,
	onPlanRename,
	onDirectoryRename,
	onSetFocusedId,
	onItemAdd,
}: DirectoryTitleProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [dirName, setDirName] = useState(node.title as string);

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
	}, [node]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isEditing]);

	useEffect(() => {
		setDirName(node.title as string);
	}, [node.title]);

	function handleEditComplete() {
		setIsEditing(false);
		if (node.parentPath.length === 0) {
			// TODO: can the plan itself not be handled separately?
			onPlanRename(dirName);
		} else {
			const newName = dirName;
			onDirectoryRename({
				parentPath: node.parentPath,
				name: node.title as string,
				newName: newName,
			});
			onSetFocusedId(node.parentPath.concat(newName).join('/'));
		}
	}

	const titleEl = isEditing ? (
		<Input
			ref={inputRef}
			className="border-none font-medium"
			value={dirName}
			size={(node.title as string).length}
			onChange={(e) => {
				setDirName(e.target.value);
			}}
			onKeyDown={(e) => {
				switch (e.key) {
					case 'Enter': {
						handleEditComplete();
						break;
					}
					case 'Escape': {
						setDirName(node.title as string);
						setIsEditing(false);
						break;
					}
				}
			}}
			onBlur={() => handleEditComplete()}
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
					'text-red-600': node.hasAnInvalidDescendant,
				})}
			>
				{node.title}
			</div>
		</div>
	);

	return (
		<div
			className="flex flex-row items-center gap-x-2"
			onClick={() => onSetFocusedId(node.id)}
		>
			<FolderIcon className="w-6 h-6" />
			{titleEl}
			{isDirty && <div>*</div>}
			<div className="flex flex-row items-baseline gap-x-2">
				<div className="text-sm font-normal text-gray-500">
					{node.immediateGameCount} / {node.totalGameCount}
				</div>
				{node.totalMissingGameCount > 0 && (
					<div className="text-xs text-red-700 italic font-thin">
						{node.totalMissingGameCount} missing
					</div>
				)}
			</div>
		</div>
	);
}

export { DirectoryTitle };
