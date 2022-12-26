import React from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../store';

function DB() {
	const catalog = useSelector((s: AppState) => {
		return s.db.catalog;
	});

	return (
		<div>
			<h2 className="text-red-700">Catalog</h2>
			<input type="text" />
			{Object.keys(catalog).length > 0 && (
				<pre>{JSON.stringify(catalog, null, 2)}</pre>
			)}
		</div>
	);
}

export { DB };
