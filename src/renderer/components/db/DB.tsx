import React from 'react';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../store';
import { updateCatalog } from './dbSlice';

function DB() {
	const catalog = useSelector((s: AppState) => {
		return s.db.catalog;
	});

	function handleUpdate() {
		dispatch(updateCatalog());
	}

	return (
		<div>
			<h2 className="text-red-700">distribution_mister</h2>
			<input type="text" />
			<div className="flex flex-row gap-x-2">
				<button onClick={handleUpdate}>Update</button>
			</div>
			{Object.keys(catalog).length > 0 && (
				<pre>{JSON.stringify(catalog, null, 2)}</pre>
			)}
		</div>
	);
}

export { DB };
