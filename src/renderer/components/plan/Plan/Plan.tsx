import React from 'react';
import SortableTree, { TreeItem } from 'react-sortable-tree';
import { CatalogEntry as CatalogEntryType } from '../../../../main/catalog/types';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
} from '../../../../main/plan/types';
import { DirectoryAddIcon, TrashIcon } from 'src/renderer/icons';
import { PlanTreeItem } from './types';
import { RSTTheme } from './RSTTheme';

type InternalPlanProps = {
	plan: Plan;
	onItemMove: (args: {
		prevParentPath: string[];
		newParentPath: string[];
		name: string;
	}) => void;
	onItemDelete: (args: { parentPath: string[]; name: string }) => void;
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
	onToggleDirectoryExpansion,
}: InternalPlanProps) {
	return (
		<div className="w-full xh-full p-8">
			<div className="w-full xh-full rounded bg-white border border-gray-200 shadow">
				<SortableTree<PlanTreeItem>
					dndType="CatalogEntry"
					treeData={createTreeData([plan], [])}
					onChange={() => {}}
					onMoveNode={({ node, nextParentNode }) => {
						const newParentPath = nextParentNode?.parentPath.concat(
							nextParentNode.title as string
						) ?? [plan.directoryName];

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
					theme={RSTTheme}
					generateNodeProps={({ path, node }) => {
						const buttons = [];

						if (node.isDirectory) {
							buttons.push(
								<DirectoryAddIcon
									className="w-5 h-5"
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
									className="w-5 h-5"
									onClick={() => {
										onItemDelete({
											parentPath: node.parentPath,
											name: node.title as string,
										});
									}}
								/>
							);
						}

						return {
							buttons,
						};
					}}
					canNodeHaveChildren={(node) => {
						return node.isDirectory;
					}}
					canDrag={({ path }) => {
						// prevent the root (which is realy just the plan's name) from dragging
						return path.length > 1;
					}}
				/>
			</div>
		</div>
	);
}

export { Plan };
