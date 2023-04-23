import React, { useState } from 'react';
import clsx from 'clsx';
import SortableTree, { TreeItem } from 'react-sortable-tree';
import { UpdateDbConfig } from '../../../../main/settings/types';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
	PlanGameEntry,
} from '../../../../main/plan/types';
import { Catalog } from '../../../../main/catalog/types';
import { getCatalogEntryForMraPath } from '../../../../main/catalog/util';
import { DirectoryAddIcon, TrashIcon } from '../../../icons';
import { PlanTreeItem } from './types';
import { FocusedDirectory } from './FocusedDirectory';
import { DirectoryTitle } from './DirectoryTitle';
import { ResolveMissingGames } from '../ResolveMissingGames';
import { PlanMode } from '../planSlice';

type InternalPlanProps = {
	mode: PlanMode;
	plan: Plan | null;
	catalog: Catalog | null;
	updateDbConfigs: UpdateDbConfig[];
	isDirty: boolean;
	onModeChange: (newMode: PlanMode) => void;
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
	onBulkRemoveMissing: (args: { parentPath: string[] }) => void;
};

function isPlanGameDirectoryEntry(
	entry: PlanGameDirectoryEntry | PlanGameEntry
): entry is PlanGameDirectoryEntry {
	return 'games' in entry;
}

function getDescendantGames(
	dir: PlanGameDirectory,
	catalog: Catalog,
	updateDbConfigs: UpdateDbConfig[]
): PlanGameEntry[] {
	return dir.reduce<PlanGameEntry[]>((accum, e) => {
		if (isPlanGameDirectoryEntry(e)) {
			return accum.concat(
				getDescendantGames(e.games, catalog, updateDbConfigs)
			);
		} else {
			const entry = getCatalogEntryForMraPath(
				e.db_id,
				e.relFilePath,
				catalog,
				updateDbConfigs
			);

			return accum.concat({
				...e,
				missing: !entry,
			});
		}
	}, []);
}

function getImmediateGames(
	dir: PlanGameDirectory,
	catalog: Catalog,
	updateDbConfigs: UpdateDbConfig[]
): PlanGameEntry[] {
	return dir.flatMap<PlanGameEntry>((e) => {
		if (isPlanGameDirectoryEntry(e)) {
			return [];
		} else {
			const entry = getCatalogEntryForMraPath(
				e.db_id,
				e.relFilePath,
				catalog,
				updateDbConfigs
			);

			return [
				{
					...e,
					missing: !entry,
				},
			];
		}
	});
}

function sortDirectoriesByTitle(
	a: TreeItem<PlanTreeItem>,
	b: TreeItem<PlanTreeItem>
) {
	return (a.title as string).localeCompare(b.title as string);
}

function sortEntriesByTitle(
	catalog: Catalog,
	updateDbConfigs: UpdateDbConfig[]
) {
	return (
		a: PlanGameDirectoryEntry | PlanGameEntry,
		b: PlanGameDirectoryEntry | PlanGameEntry
	): number => {
		if ('directoryName' in a) {
			if ('directoryName' in b) {
				return a.directoryName.localeCompare(b.directoryName);
			} else {
				return -1;
			}
		}

		if ('directoryName' in b) {
			return 1;
		}

		const aEntry = getCatalogEntryForMraPath(
			a.db_id,
			a.relFilePath,
			catalog,
			updateDbConfigs
		);
		const bEntry = getCatalogEntryForMraPath(
			b.db_id,
			b.relFilePath,
			catalog,
			updateDbConfigs
		);

		if (!aEntry && bEntry) {
			return 1;
		}

		if (aEntry && !bEntry) {
			return -1;
		}

		if (!aEntry && !bEntry) {
			return a.relFilePath.localeCompare(b.relFilePath);
		} else {
			return aEntry!.gameName.localeCompare(bEntry!.gameName);
		}
	};
}

function createTreeData(
	planDir: PlanGameDirectory,
	catalog: Catalog,
	updateDbConfigs: UpdateDbConfig[],
	parentPath: string[]
): TreeItem<PlanTreeItem>[] {
	const treeItems = planDir.flatMap((g) => {
		if (isPlanGameDirectoryEntry(g)) {
			const subData = createTreeData(g.games, catalog, updateDbConfigs, [
				...parentPath,
				g.directoryName,
			]);
			const descendantGames = getDescendantGames(
				g.games,
				catalog,
				updateDbConfigs
			);
			const immediateGames = getImmediateGames(
				g.games,
				catalog,
				updateDbConfigs
			);

			return [
				{
					id: parentPath.join('/') + '/' + g.directoryName,
					title: g.directoryName,
					expanded: typeof g.isExpanded === 'undefined' ? true : g.isExpanded,
					children: subData,
					isDirectory: true,
					parentPath,
					immediateGameCount: immediateGames.length,
					immediateValidGameCount: immediateGames.filter(
						(g) => !('missing' in g) || !g.missing
					).length,
					immediateMissingGameCount: g.games.filter(
						(g) => 'missing' in g && g.missing
					).length,
					totalGameCount: descendantGames.length,
					totalValidGameCount: descendantGames.filter(
						(g) => !('missing' in g) || !g.missing
					).length,
					totalMissingGameCount: descendantGames.filter(
						(g) => 'missing' in g && g.missing
					).length,
					// in dev mode, g.games is mutation protected
					entries: [...g.games].sort(
						sortEntriesByTitle(catalog, updateDbConfigs)
					),
					hasAnInvalidDescendant: !!g.hasAnInvalidDescendant,
				} as TreeItem<PlanTreeItem>,
			];
		} else {
			return [];
		}
	});

	return treeItems.sort(sortDirectoriesByTitle);
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
	mode,
	plan,
	catalog,
	updateDbConfigs,
	isDirty,
	onModeChange,
	onItemAdd,
	onItemDelete,
	onItemMove,
	onDirectoryAdd,
	onPlanRename,
	onDirectoryRename,
	onToggleDirectoryExpansion,
	onBulkAdd,
	onBulkRemoveMissing,
}: InternalPlanProps) {
	const [focusedId, setFocusedId] = useState('');

	// this craziness of the planDataSeed and hidden class is due to react-sortable-tree.
	// It renders a DragDropContext. going from plan -> no plan -> plan would create a new tree,
	// and thus a new DragDropContext, causing react-dnd to blow up with "Cannot have two HTML5 backends at the same time"
	// the fix was to never create a new tree. If we don't have a plan, render a tree with no nodes that is hidden.
	//
	// You can go from plan -> no plan using undo: Create a new plan, undo it, create a new plan
	const planDataSeed = plan && catalog ? [plan] : [];
	const treeData =
		plan && catalog
			? createTreeData(planDataSeed, catalog, updateDbConfigs, [])
			: [];

	if (plan) {
		treeData[0].isDirty = isDirty;
	}

	const focusedNode = findFocusedNode(treeData, focusedId);

	return (
		<div
			className={clsx('w-full', {
				hidden: !plan,
				'p-8': mode === 'tree',
				'pl-8 pt-8': mode === 'resolve',
			})}
			style={{ height: 'calc(100vh - 2rem)' }}
		>
			<div
				className={clsx(
					'w-full h-full rounded bg-white border border-gray-200 shadow p-4 pr-0 grid grid-cols-3',
					{
						hidden: mode !== 'tree',
					}
				)}
			>
				<div className="plan-tree-container w-full overflow-x-auto overflow-y-auto col-span-2 flex flex-col gap-y-2">
					{treeData[0]?.totalMissingGameCount > 0 && (
						<div className="bg-red-50 text-sm px-2 py-1">
							{treeData[0].totalMissingGameCount} game
							{treeData[0].totalMissingGameCount === 1 ? '' : 's'} are missing{' '}
							<a
								className="text-blue-600 text-sm underline cursor-pointer"
								onClick={() => {
									onModeChange('resolve');
								}}
							>
								fix
							</a>
						</div>
					)}
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
						generateNodeProps={({ path, node }) => {
							const buttons = [];

							if (node.title !== 'favorites') {
								buttons.push(
									<DirectoryAddIcon
										key="directory-add"
										className="w-5 h-5 invisible group-hover:visible mr-2 cursor-pointer"
										onClick={() => {
											onDirectoryAdd({
												parentPath: node.parentPath.concat(
													node.title as string
												),
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
									key={node.title as string}
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
							return (
								nextParent?.id !== prevParent?.id &&
								nextParent?.title !== 'favorites'
							);
						}}
					/>
				</div>
				{!!focusedNode && !!catalog && (
					<FocusedDirectory
						focusedNode={focusedNode}
						catalog={catalog}
						updateDbConfigs={updateDbConfigs}
						onBulkAdd={onBulkAdd}
						onBulkRemoveMissing={onBulkRemoveMissing}
						onItemAdd={onItemAdd}
						onItemDelete={onItemDelete}
						planName={plan!.directoryName}
					/>
				)}
			</div>
			{mode === 'resolve' && !!plan && !!catalog && (
				<ResolveMissingGames
					plan={plan}
					catalog={catalog}
					updateDbConfigs={updateDbConfigs}
					onClose={() => onModeChange('tree')}
				/>
			)}
		</div>
	);
}

export { Plan };
