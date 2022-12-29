import React from 'react';
import { Catalog as CatalogType } from '../../../../main/catalog/types';
import { CatalogEntry } from '../CatalogEntry';

type InternalCatalogProps = {
	catalog: CatalogType;
};

function Catalog({ catalog }: InternalCatalogProps) {
	const { updatedAt, ...restOfCatalog } = catalog;

	const dbs = Object.entries(restOfCatalog);

	return (
		<ul>
			{dbs.flatMap((db) => {
				const [dbName, gameEntries] = db;
				const games = gameEntries.map((ge, i) => {
					return (
						<li
							key={ge.gameName + i}
							className="even:bg-gray-50 border border-b-gray-200"
						>
							<CatalogEntry entry={ge} />
						</li>
					);
				});

				return [
					<li
						key={dbName}
						className="py-2 pl-1.5 font-bold sticky top-0 z-50 bg-white"
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
