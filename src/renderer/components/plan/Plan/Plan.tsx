import React from 'react';
import clsx from 'clsx';
import SortableTree, { TreeItem } from 'react-sortable-tree';
import { CatalogEntry as CatalogEntryType } from '../../../../main/catalog/types';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
} from '../../../../main/plan/types';
import { DirectoryAddIcon, TrashIcon } from 'src/renderer/icons';
import { PlanTreeItem } from './types';
import { Input } from '../../Input';
import { CatalogEntry } from '../../catalog/CatalogEntry';

type InternalPlanProps = {
	plan: Plan | null;
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
};

function isPlanGameDirectoryEntry(
	entry: CatalogEntryType | PlanGameDirectoryEntry
): entry is PlanGameDirectoryEntry {
	return 'games' in entry;
}

function countDescendantGames(dir: PlanGameDirectory): number {
	return dir.reduce<number>((accum, e) => {
		if (isPlanGameDirectoryEntry(e)) {
			return accum + countDescendantGames(e.games);
		} else {
			return accum + 1;
		}
	}, 0);
}

function createTreeData(
	planDir: PlanGameDirectory,
	parentPath: string[]
): TreeItem<PlanTreeItem>[] {
	return planDir.map((g) => {
		if (isPlanGameDirectoryEntry(g)) {
			const subData = createTreeData(g.games, [...parentPath, g.directoryName]);
			return {
				title: g.directoryName,
				expanded: typeof g.isExpanded === 'undefined' ? true : g.isExpanded,
				children: subData,
				isDirectory: true,
				parentPath,
				totalGameCount: countDescendantGames(g.games),
			};
		} else {
			return {
				title: g.gameName,
				isDirectory: false,
				parentPath,
				catalogEntry: g,
			};
		}
	});
}

function Plan({
	plan,
	onItemAdd,
	onItemDelete,
	onItemMove,
	onDirectoryAdd,
	onPlanRename,
	onDirectoryRename,
	onToggleDirectoryExpansion,
}: InternalPlanProps) {
	// this craziness of the planDataSeed and hidden class is due to react-sortable-tree.
	// It renders a DragDropContext. going from plan -> no plan -> plan would create a new tree,
	// and thus a new DragDropContext, causing react-dnd to blow up with "Cannot have two HTML5 backends at the same time"
	// the fix was to never create a new tree. If we don't have a plan, render a tree with no nodes that is hidden.
	//
	// You can go from plan -> no plan using undo: Create a new plan, undo it, create a new plan

	const planDataSeed = plan ? [plan] : [];
	return (
		<div
			className={clsx('w-full xh-full p-8', {
				hidden: !plan,
			})}
		>
			<div className="w-full rounded bg-white border border-gray-200 shadow p-4">
				<SortableTree<PlanTreeItem>
					dndType="CatalogEntry"
					treeData={createTreeData(planDataSeed, [])}
					onChange={() => {}}
					onMoveNode={({ node, nextParentNode }) => {
						const newParentPath = nextParentNode?.parentPath.concat(
							nextParentNode.title as string
						) ?? [plan!.directoryName];

						if (node.parentPath) {
							const name = node.title as string;
							const prevParentPath = node.parentPath;

							onItemMove({ prevParentPath, newParentPath, name });
						} else {
							if (node.mraFileName && node.db_id) {
								// TODO: emit an error if the entry lacks an mra
								onItemAdd({
									parentPath: newParentPath,
									db_id: node.db_id,
									mraFileName: node.mraFileName,
								});
							}
						}
					}}
					onVisibilityToggle={({ node }) => {
						if (node.isDirectory) {
							const path = node.parentPath.concat(node.title as string);
							onToggleDirectoryExpansion(path);
						}
					}}
					isVirtualized={false}
					generateNodeProps={({ path, parentNode, node }) => {
						const buttons = [];

						const pChildren = (
							parentNode && parentNode.isDirectory ? parentNode.children : []
						) as any[];
						const isEvenGame = pChildren.indexOf(node) % 2 === 0;

						if (node.isDirectory) {
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
						}

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
									}}
								/>
							);
						}

						const result: Record<string, unknown> = {
							className: clsx('group', {
								'cursor-default': !node.isDirectory,
								'node-directory': node.isDirectory,
								'bg-gray-50 is-odd-game': !isEvenGame,
								'bg-white is-even-game': isEvenGame,
							}),
							buttons,
						};

						if (node.isDirectory) {
							result.title = (
								<div className="flex flex-row items-baseline gap-x-2">
									<Input
										className="border-none"
										style={{ fontWeight: 'normal' }}
										value={node.title as string}
										onChange={(e) => {
											if (node.parentPath.length === 0) {
												// TODO: can the plan itself not be handled separately?
												onPlanRename(e.target.value);
											} else {
												onDirectoryRename({
													parentPath: node.parentPath,
													name: node.title as string,
													newName: e.target.value,
												});
											}
										}}
									/>
									<div className="text-sm font-normal text-gray-500">
										{node.totalGameCount} game
										{node.totalGameCount === 1 ? '' : 's'}
									</div>
								</div>
							);
						} else {
							if (node.catalogEntry) {
								result.title = (
									<CatalogEntry
										entry={node.catalogEntry}
										hideIcons
										hideInPlan
									/>
								);
							}
						}

						return result;
					}}
					canNodeHaveChildren={(node) => {
						return node.isDirectory;
					}}
					canDrag={({ path }) => {
						// prevent the root (which is really just the plan's name) from dragging
						return path.length > 1;
					}}
				/>
			</div>
		</div>
	);
}

export { Plan };
