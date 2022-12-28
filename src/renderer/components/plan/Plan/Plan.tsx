import React from 'react';
import { CatalogEntry } from '../../../../main/catalog/types';
import {
	Plan,
	PlanGameDirectory,
	PlanGameDirectoryEntry,
} from '../../../../main/plan/types';
import Tree, { RenderItemParams, TreeData, TreeItem } from '@atlaskit/tree';

type InternalPlanProps = {
	plan: Plan;
};

function isPlanGameDirectoryEntry(
	entry: CatalogEntry | PlanGameDirectoryEntry
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
			root: true,
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

function Plan({ plan }: InternalPlanProps) {
	function renderItem({ item, depth, provided }: RenderItemParams) {
		const content = item.data?.root
			? '/'
			: item.data?.entry?.directoryName ?? item.data?.entry?.gameName ?? '';

		return (
			<div style={{ marginLeft: depth * 10 }} ref={provided.innerRef}>
				{content}
			</div>
		);
	}

	return <Tree tree={convertPlanToTree(plan)} renderItem={renderItem} />;
}

export { Plan };
