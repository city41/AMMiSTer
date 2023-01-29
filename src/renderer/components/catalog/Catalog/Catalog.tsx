import React, { useCallback, useState } from 'react';
import { CloseIcon } from '../../../icons';
import {
	Catalog as CatalogType,
	CatalogEntry as CatalogEntryType,
} from '../../../../main/catalog/types';
import { UpdateDbConfig } from '../../../../main/settings/types';
import { CatalogEntry } from '../CatalogEntry';

type InternalCatalogProps = {
	catalog: CatalogType;
	updateDbConfigs: UpdateDbConfig[];
};

function Catalog({ catalog, updateDbConfigs }: InternalCatalogProps) {
	const [filter, setFilter] = useState('');
	const { updatedAt, ...restOfCatalog } = catalog;

	const filterFn = useCallback(
		(ge: CatalogEntryType) => {
			const f = filter.toLowerCase().trim();
			return (
				ge.categories.some((c) => c.toLowerCase().includes(f)) ||
				ge.gameName.toLowerCase().includes(f) ||
				ge.yearReleased?.toString().includes(f) ||
				ge.manufacturer.some((m) => m.toLowerCase().includes(f))
			);
		},
		[filter]
	);

	const lis = updateDbConfigs.flatMap((db) => {
		if (!db.enabled) {
			return [];
		}

		const gameEntries = restOfCatalog[db.db_id];
		if (!gameEntries) {
			// this can happen when a db has been re-enabled but a catalog update has not happened yet
			return [];
		}

		const filtered = filter.trim() ? gameEntries.filter(filterFn) : gameEntries;

		const games = filtered.map((ge, i) => {
			return (
				<li
					key={ge.gameName + i}
					className="even:bg-gray-50 border border-b-gray-200 cursor-grab"
				>
					<CatalogEntry className="px-2 py-1" entry={ge} />
				</li>
			);
		});

		if (games.length === 0) {
			return [];
		}

		return [
			<li
				key={db.db_id}
				className="py-2 px-1.5 font-bold sticky top-0 z-40 bg-indigo-50 text-indigo-600 grid gap-x-2 items-baseline border-b border-t border-b-indigo-500 border-t-indigo-500 first:border-t-transparent"
				style={{ gridTemplateColumns: '1fr max-content' }}
			>
				<div className="whitespace-nowrap text-ellipsis overflow-hidden">
					{db.displayName}
				</div>
				<div className="font-normal text-sm text-gray-500">
					{games.length} game{games.length === 1 ? '' : 's'}
					{filter.trim() ? ' that match' : ''}
				</div>
			</li>,
			...games,
		];
	});

	return (
		<div>
			<div className="relative py-2 px-1.5">
				<input
					className="w-full p-0.5"
					type="text"
					placeholder="filter"
					value={filter}
					onChange={(e) => {
						setFilter(e.target.value);
					}}
				/>
				<div className="w-4 absolute top-0 bottom-0 right-2 grid place-items-center">
					<CloseIcon
						className="w-4 h-4 cursor-pointer text-gray-500"
						onClick={() => {
							setFilter('');
						}}
					/>
				</div>
			</div>
			{lis.length === 0 && (
				<div className="px-4 py-2 text-sm italic text-gray-500">No matches</div>
			)}
			<ul>{lis}</ul>
		</div>
	);
}

export { Catalog };
