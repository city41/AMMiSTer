import React from 'react';
import { Catalog } from '../../../../main/db/types';
import { CatalogEntry } from '../CatalogEntry';

type InternalCatalogProps = {
	catalog: Catalog;
};

function Catalog({ catalog }: InternalCatalogProps) {
	const { updatedAt, ...restOfCatalog } = catalog;

	const dbs = Object.entries(restOfCatalog);

	return (
		<ul className="relative">
			{dbs.flatMap((db) => {
				const [dbName, gameEntries] = db;
				const games = gameEntries.map((ge, i) => {
					return (
						<li key={ge.gameName + i}>
							<CatalogEntry entry={ge} />
						</li>
					);
				});

				return [
					<li
						key={dbName}
						className="py-2 pl-1.5 font-bold sticky top-0 z-50 bg-white border border-l-black border-t-black border-b-black"
					>
						{dbName}
					</li>,
					...games,
				];
			})}
		</ul>
	);
}

export { Catalog };
