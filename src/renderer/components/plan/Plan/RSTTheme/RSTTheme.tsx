import React, { Children, cloneElement } from 'react';
import clsx from 'clsx';
import {
	NodeRendererProps,
	ThemeProps,
	TreeRendererProps,
} from 'react-sortable-tree';
import { PlanTreeItem } from '../types';
import { ChevronRightIcon, ChevronDownIcon } from 'src/renderer/icons';
import { dispatch } from '../../../../store';
import { setDetailEntry } from '../../../catalog/catalogSlice';

// interface ThemeTreeProps<T = {}> {
//     style?: React.CSSProperties | undefined;
//     innerStyle?: React.CSSProperties | undefined;
//     reactVirtualizedListProps?: Partial<ListProps> | undefined;
//     scaffoldBlockPxWidth?: number | undefined;
//     slideRegionSize?: number | undefined;
//     rowHeight?: ((info: NodeData<T> & Index) => number) | number | undefined;
//     nodeContentRenderer?: NodeRenderer<T> | undefined;
//     placeholderRenderer?: PlaceholderRenderer<T> | undefined;
// }

// export interface ThemeProps<T = {}> extends ThemeTreeProps<T> {
//     treeNodeRenderer?: TreeRenderer<T> | undefined;
// }

// export type TreeRenderer<T = {}> = React.ComponentType<TreeRendererProps<T>>;

// export interface TreeRendererProps<T = {}> {
//     treeIndex: number;
//     treeId: string;
//     swapFrom?: number | undefined;
//     swapDepth?: number | undefined;
//     swapLength?: number | undefined;
//     scaffoldBlockPxWidth: number;
//     lowerSiblingCounts: number[];
//     rowDirection?: 'ltr' | 'rtl' | undefined;

//     listIndex: number;
//     children: JSX.Element[];
//     style?: React.CSSProperties | undefined;

//     // Drop target
//     connectDropTarget: ConnectDropTarget;
//     isOver: boolean;
//     canDrop?: boolean | undefined;
//     draggedNode?: TreeItem<T> | undefined;

//     // used in dndManager
//     getPrevRow: () => FlatDataItem | null;
//     node: TreeItem<T>;
//     path: NumberOrStringArray;
// }

function TreeNodeRenderer({
	connectDropTarget,
	children,
	isOver,
	canDrop,
	draggedNode,
	node,
}: TreeRendererProps<PlanTreeItem>) {
	return connectDropTarget(
		<div
			className={clsx({
				'even:bg-gray-50': !node.isDirectory,
			})}
		>
			{Children.map(children, (child) => {
				return cloneElement(child, {
					isOver,
					canDrop,
					draggedNode,
				});
			})}
		</div>
	);
}

// export type NodeRenderer<T = {}> = React.ComponentType<NodeRendererProps<T>>;

// export interface NodeRendererProps<T = {}> {
//     node: TreeItem<T>;
//     path: NumberOrStringArray;
//     treeIndex: number;
//     isSearchMatch: boolean;
//     isSearchFocus: boolean;
//     canDrag: boolean;
//     scaffoldBlockPxWidth: number;
//     toggleChildrenVisibility?(data: NodeData<T>): void;
//     buttons?: JSX.Element[] | undefined;
//     className?: string | undefined;
//     style?: React.CSSProperties | undefined;
//     title?: ((data: NodeData<T>) => JSX.Element | JSX.Element) | undefined;
//     subtitle?: ((data: NodeData<T>) => JSX.Element | JSX.Element) | undefined;
//     icons?: JSX.Element[] | undefined;
//     lowerSiblingCounts: number[];
//     swapDepth?: number | undefined;
//     swapFrom?: number | undefined;
//     swapLength?: number | undefined;
//     listIndex: number;
//     treeId: string;
//     rowDirection?: 'ltr' | 'rtl' | undefined;

//     connectDragPreview: ConnectDragPreview;
//     connectDragSource: ConnectDragSource;
//     parentNode?: TreeItem<T> | undefined;
//     startDrag: any;
//     endDrag: any;
//     isDragging: boolean;
//     didDrop: boolean;
//     draggedNode?: TreeItem<T> | undefined;
//     isOver: boolean;
//     canDrop?: boolean | undefined;
// }

const depthToDirectoryClasses: Record<number, string> = {
	1: 'bg-indigo-200 text-indigo-900',
	2: 'bg-indigo-300 text-indigo-900',
	3: 'bg-indigo-600 text-indigo-200',
};

function NodeContentRenderer({
	connectDragPreview,
	connectDragSource,
	canDrag,
	title,
	node,
	path,
	treeIndex,
	isDragging,
	scaffoldBlockPxWidth,
	buttons,
	toggleChildrenVisibility,
}: NodeRendererProps<PlanTreeItem>) {
	const nodeTitle = title ?? node.title;
	const titleContent =
		typeof nodeTitle === 'function'
			? nodeTitle({ node, path, treeIndex })
			: nodeTitle;

	const handleTitleClick = node.isDirectory
		? undefined
		: function () {
				if (node.catalogEntry) {
					dispatch(setDetailEntry(node.catalogEntry));
				}
		  };

	const Chevron = node.expanded ? ChevronDownIcon : ChevronRightIcon;
	const el = connectDragPreview(
		<div
			className={clsx(
				'border border-gray-200 py-2 flex flex-row items-center gap-x-2 pr-3 group select-none',
				{
					'cursor-grab': path.length > 1,
					'opacity-50': isDragging,
					[depthToDirectoryClasses[path.length]]: node.isDirectory,
				}
			)}
			style={{ paddingLeft: scaffoldBlockPxWidth * path.length }}
		>
			{node.isDirectory && (
				<Chevron
					className="w-5 h-5"
					onClick={() => toggleChildrenVisibility?.({ node, path, treeIndex })}
				/>
			)}
			<div className="flex-1 flex items-start">
				<div
					className={clsx('w-auto', {
						'font-medium hover:underline cursor-pointer w-auto gap-x-2':
							!node.isDirectory,
						'flex flex-row gap-x-2 items-baseline': node.isDirectory,
					})}
					onClick={handleTitleClick}
				>
					<div>{titleContent}</div>
					{typeof node.totalGameCount === 'number' && (
						<div className="text-sm">{node.totalGameCount} games</div>
					)}
				</div>
			</div>

			<div className="cursor-pointer flex flex-row gap-x-2 invisible group-hover:visible">
				{buttons}
			</div>
		</div>
	);

	if (canDrag) {
		return connectDragSource(el);
	} else {
		return el;
	}
}

const RSTTheme: ThemeProps<PlanTreeItem> = {
	treeNodeRenderer: TreeNodeRenderer,
	nodeContentRenderer: NodeContentRenderer,
};

export { RSTTheme };
