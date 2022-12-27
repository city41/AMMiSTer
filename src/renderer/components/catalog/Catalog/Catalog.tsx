import React from 'react';
import { Catalog } from '../../../../main/db/types';

type InternalCatalogProps = {
	catalog: Catalog;
};

function Catalog({ catalog }: InternalCatalogProps) {
	const { updatedAt, ...restOfCatalog } = catalog;

	const dbs = Object.entries(restOfCatalog);

	return (
		<ul>
			<li>Updated at: {new Date(updatedAt).toISOString()}</li>
			{dbs.flatMap((db) => {
				const [dbName, gameEntries] = db;
				const games = gameEntries.map((ge, i) => {
					return <li key={ge.gameName + i}>{ge.gameName}</li>;
				});

				return [
					<li key={dbName} className="p-4 font-bold">
						{dbName}
					</li>,
					...games,
				];
			})}
		</ul>
	);
}

export { Catalog };
