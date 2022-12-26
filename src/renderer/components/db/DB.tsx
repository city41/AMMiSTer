import React from 'react';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../store';
import { buildGameCatalog, updateCatalog } from './dbSlice';

function DB() {
	const catalog = useSelector((s: AppState) => {
		return s.db.catalog;
	});

	function handleCatalog() {
		dispatch(buildGameCatalog());
	}

	function handleUpdate() {
		dispatch(updateCatalog());
	}

	return (
		<div>
			<h2 className="text-red-700">distribution_mister</h2>
			<input type="text" />
			<div className="flex flex-row gap-x-2">
				<button onClick={handleCatalog}>Catalog</button>
				<button onClick={handleUpdate}>Update</button>
			</div>
			<pre>{JSON.stringify(catalog, null, 2)}</pre>
		</div>
	);
}

export { DB };
