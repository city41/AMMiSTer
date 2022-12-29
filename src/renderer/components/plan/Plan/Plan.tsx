import React, { useState } from 'react';
import clsx from 'clsx';
import { CatalogEntry as CatalogEntryType } from '../../../../main/catalog/types';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
} from '../../../../main/plan/types';
import Tree, {
	ItemId,
	mutateTree,
	RenderItemParams,
	TreeData,
	TreeItem,
} from '@atlaskit/tree';
import { CatalogEntry } from '../../catalog/CatalogEntry';
import {
	ChevronRightIcon,
	ChevronDownIcon,
	DirectoryAddIcon,
	TrashIcon,
} from 'src/renderer/icons';

type InternalPlanProps = {
	plan: Plan;
};

function isPlanGameDirectoryEntry(
	entry: CatalogEntryType | PlanGameDirectoryEntry
): entry is PlanGameDirectoryEntry {
	return 'games' in entry;
}

function getTreeItems(
	gameDir: PlanGameDirectory,
	keyRoot: string
): Record<string, TreeItem> {
	let items: Record<string, TreeItem> = {};

	for (let i = 0; i < gameDir.length; ++i) {
		const entry = gameDir[i];
		if (isPlanGameDirectoryEntry(entry)) {
			const subItems = getTreeItems(
				entry.games,
				`${keyRoot}-${entry.directoryName}`
			);
			items = {
				...items,
				...subItems,
				[`${keyRoot}-${entry.directoryName}`]: {
					id: `${keyRoot}-${entry.directoryName}`,
					children: entry.games.map((childEntry, i) => {
						if (isPlanGameDirectoryEntry(childEntry)) {
							return `${keyRoot}-${entry.directoryName}-${childEntry.directoryName}`;
						} else {
							return `${keyRoot}-${entry.directoryName}-${i}`;
						}
					}),
					hasChildren: entry.games.length > 0,
					isExpanded: true,
					isChildrenLoading: false,
					data: {
						entry,
					},
				},
			};
		} else {
			items[`${keyRoot}-${i}`] = {
				id: `${keyRoot}-${i}`,
				children: [],
				hasChildren: false,
				isExpanded: false,
				isChildrenLoading: false,
				data: {
					entry,
				},
			};
		}
	}

	return items;
}

function convertPlanToTree(plan: Plan): TreeData {
	const items = getTreeItems(plan.games, 'root');

	const rootItem: TreeItem = {
		id: 'root',
		children: plan.games.map((childEntry, i) => {
			if (isPlanGameDirectoryEntry(childEntry)) {
				return `root-${childEntry.directoryName}`;
			} else {
				return `root-${i}`;
			}
		}),
		hasChildren: plan.games.length > 0,
		isExpanded: true,
		isChildrenLoading: false,
		data: {
			entry: {
				directoryName: plan.name,
			},
		},
	};

	return {
		rootId: 'root',
		items: {
			...items,
			root: rootItem,
		},
	};
}

function countDescendants(item: TreeItem, tree: TreeData): number {
	return item.children.reduce<number>((accum, childId) => {
		const child = tree.items[childId];

		if (child.data?.entry?.directoryName) {
			const childDescendantCount = countDescendants(child, tree);
			return accum + childDescendantCount;
		} else {
			return accum + 1;
		}
	}, 0);
}

function Plan({ plan }: InternalPlanProps) {
	const [tree, setTree] = useState(convertPlanToTree(plan));

	function renderItem({
		item,
		depth,
		provided,
		onCollapse,
		onExpand,
	}: RenderItemParams) {
		const isDir = !!item.data?.entry?.directoryName;

		let content;

		if (isDir) {
			const Icon = item.isExpanded ? ChevronDownIcon : ChevronRightIcon;
			content = (
				<div className="flex flex-row items-center gap-x-2">
					<Icon
						className="w-5 h-5 cursor-pointer hover:bg-green-100 rounded"
						onClick={() => {
							if (item.isExpanded) {
								onCollapse(item.id);
							} else {
								onExpand(item.id);
							}
						}}
					/>
					<div className="flex flex-row items-center justify-between flex-1">
						<div className="flex flex-row gap-x-2 items-center">
							<div>{item.data?.entry?.directoryName}</div>
							<div className="text-xs">
								({countDescendants(item, tree)} games)
							</div>
						</div>
						<DirectoryAddIcon className="w-5 h-5 invisible group-hover:visible cursor-pointer" />
					</div>
				</div>
			);
		} else {
			content = <CatalogEntry hideIcons entry={item.data.entry} />;
		}
		return (
			<div
				style={{
					paddingLeft: depth * 30 + 5,
					backgroundColor: isDir
						? `rgb(0, 0, 0, ${0.3 - 0.1 * depth})`
						: undefined,
				}}
				className={clsx(
					'p-2 border-b border-gray-200 flex flex-row items-center justify-between group',
					{
						'even:bg-gray-50': !isDir,
					}
				)}
				ref={provided.innerRef}
			>
				<div className="flex-1 mr-4">{content}</div>
				<TrashIcon className="w-5 h-5 invisible group-hover:visible cursor-pointer" />
			</div>
		);
	}

	function handleExpand(itemId: ItemId) {
		setTree(mutateTree(tree, itemId, { isExpanded: true }));
	}

	function handleCollapse(itemId: ItemId) {
		setTree(mutateTree(tree, itemId, { isExpanded: false }));
	}

	return (
		<div className="w-full h-full p-8">
			<div className="w-full xh-full rounded bg-white border border-gray-200 shadow">
				<div className="px-4 py-5 sm:px-6 border-b border-gray-200">
					<h1 className="text-lg font-medium leading-6 text-gray-900">
						{plan.name}
					</h1>
				</div>
				<Tree
					tree={tree}
					renderItem={renderItem}
					onExpand={handleExpand}
					onCollapse={handleCollapse}
				/>
			</div>
		</div>
	);
}

export { Plan };
