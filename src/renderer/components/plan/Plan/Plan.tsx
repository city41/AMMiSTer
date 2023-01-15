import React, { useState } from 'react';
import clsx from 'clsx';
import SortableTree, { TreeItem } from 'react-sortable-tree';
import { CatalogEntry as CatalogEntryType } from '../../../../main/catalog/types';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
} from '../../../../main/plan/types';
import { DirectoryAddIcon, TrashIcon } from '../../../icons';
import { PlanTreeItem } from './types';
import { FocusedDirectory } from './FocusedDirectory';
import { DirectoryTitle } from './DirectoryTitle';

type InternalPlanProps = {
	plan: Plan | null;
	isDirty: boolean;
	onItemMove: (args: {
		prevParentPath: string[];
		newParentPath: string[];
		name: string;
	}) => void;
	onItemDelete: (args: { parentPath: string[]; name: string }) => void;
	onPlanRename: (newName: string) => void;
	onDirectoryRename: (args: {
		parentPath: string[];
		name: string;
		newName: string;
	}) => void;
	onItemAdd: (args: {
		parentPath: string[];
		db_id: string;
		mraFileName: string;
	}) => void;
	onDirectoryAdd: (args: { parentPath: string[] }) => void;
	onToggleDirectoryExpansion: (path: string[]) => void;
	onBulkAdd: (planPath: string) => void;
};

function isPlanGameDirectoryEntry(
	entry: CatalogEntryType | PlanGameDirectoryEntry
): entry is PlanGameDirectoryEntry {
	return 'games' in entry;
}

function getDescendantGames(dir: PlanGameDirectory): CatalogEntryType[] {
	return dir.reduce<CatalogEntryType[]>((accum, e) => {
		if (isPlanGameDirectoryEntry(e)) {
			return accum.concat(getDescendantGames(e.games));
		} else {
			return accum.concat(e);
		}
	}, []);
}

function createTreeData(
	planDir: PlanGameDirectory,
	parentPath: string[]
): TreeItem<PlanTreeItem>[] {
	return planDir.flatMap((g) => {
		if (isPlanGameDirectoryEntry(g)) {
			const subData = createTreeData(g.games, [...parentPath, g.directoryName]);
			const descendantGames = getDescendantGames(g.games).sort((a, b) => {
				return a.gameName.localeCompare(b.gameName);
			});
			return [
				{
					id: parentPath.join('/') + '/' + g.directoryName,
					title: g.directoryName,
					expanded: typeof g.isExpanded === 'undefined' ? true : g.isExpanded,
					children: subData,
					isDirectory: true,
					parentPath,
					immediateGameCount: g.games.filter((g) => 'gameName' in g).length,
					totalGameCount: descendantGames.length,
					entries: g.games,
				},
			];
		} else {
			return [];
		}
	});
}

function findFocusedNode(
	data: TreeItem<PlanTreeItem>[],
	focusedId: string
): TreeItem<PlanTreeItem> | null {
	for (const node of data) {
		if (Array.isArray(node.children)) {
			const focusedNode = findFocusedNode(node.children, focusedId);
			if (focusedNode) {
				return focusedNode;
			}
		}

		if (node.id === focusedId) {
			return node;
		}
	}

	return null;
}

function Plan({
	plan,
	isDirty,
	onItemAdd,
	onItemDelete,
	onItemMove,
	onDirectoryAdd,
	onPlanRename,
	onDirectoryRename,
	onToggleDirectoryExpansion,
	onBulkAdd,
}: InternalPlanProps) {
	const [focusedId, setFocusedId] = useState('');

	// this craziness of the planDataSeed and hidden class is due to react-sortable-tree.
	// It renders a DragDropContext. going from plan -> no plan -> plan would create a new tree,
	// and thus a new DragDropContext, causing react-dnd to blow up with "Cannot have two HTML5 backends at the same time"
	// the fix was to never create a new tree. If we don't have a plan, render a tree with no nodes that is hidden.
	//
	// You can go from plan -> no plan using undo: Create a new plan, undo it, create a new plan
	const planDataSeed = plan ? [plan] : [];
	const treeData = createTreeData(planDataSeed, []);

	if (plan) {
		treeData[0].isDirty = isDirty;
	}

	const focusedNode = findFocusedNode(treeData, focusedId);

	return (
		<div
			className={clsx('w-full h-full p-8', {
				hidden: !plan,
			})}
		>
			<div className="w-full h-full rounded bg-white border border-gray-200 shadow p-4 pr-0 grid grid-cols-3">
				<div className="plan-tree-container w-full overflow-x-auto overflow-y-auto col-span-2">
					<SortableTree<PlanTreeItem>
						treeData={treeData}
						onChange={() => {}}
						onMoveNode={({ node, nextParentNode }) => {
							if (node.parentPath && nextParentNode) {
								const newParentPath = nextParentNode.parentPath.concat(
									nextParentNode.title as string
								);

								const name = node.title as string;
								const prevParentPath = node.parentPath;

								onItemMove({ prevParentPath, newParentPath, name });
							}
						}}
						onVisibilityToggle={({ node }) => {
							const path = node.parentPath.concat(node.title as string);
							onToggleDirectoryExpansion(path);
						}}
						isVirtualized={false}
						generateNodeProps={({ path, parentNode, node }) => {
							const buttons = [];

							buttons.push(
								<DirectoryAddIcon
									key="directory-add"
									className="w-5 h-5 invisible group-hover:visible mr-2 cursor-pointer"
									onClick={() => {
										onDirectoryAdd({
											parentPath: node.parentPath.concat(node.title as string),
										});
									}}
								/>
							);

							if (path.length > 1) {
								buttons.push(
									<TrashIcon
										key="trash"
										className="w-5 h-5 invisible group-hover:visible cursor-pointer cursor-"
										onClick={() => {
											onItemDelete({
												parentPath: node.parentPath,
												name: node.title as string,
											});

											if (node.id === focusedId) {
												setFocusedId('');
											}
										}}
									/>
								);
							}

							const result: Record<string, unknown> = {
								className: clsx('group', {
									'focused-directory': node.id === focusedId,
								}),
								buttons,
							};

							result.title = (
								<DirectoryTitle
									node={node}
									isDirty={!!node.isDirty}
									onSetFocusedId={(focusedId) => setFocusedId(focusedId)}
									onDirectoryRename={onDirectoryRename}
									onPlanRename={onPlanRename}
									onItemAdd={onItemAdd}
								/>
							);

							return result;
						}}
						canDrag={({ path }) => {
							// prevent the root (which is really just the plan's name) from dragging
							return path.length > 1;
						}}
						canDrop={({ nextParent, prevParent }) => {
							return nextParent?.id !== prevParent?.id;
						}}
					/>
				</div>
				{!!focusedNode && (
					<FocusedDirectory
						focusedNode={focusedNode}
						onBulkAdd={onBulkAdd}
						onItemAdd={onItemAdd}
						onItemDelete={onItemDelete}
						planName={plan!.directoryName}
					/>
				)}
			</div>
		</div>
	);
}

export { Plan };
