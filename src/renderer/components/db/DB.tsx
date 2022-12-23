import React from 'react';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../store';
import { loadDb } from './dbSlice';

function DB() {
	const db = useSelector((s: AppState) => {
		return s.db.dbs.distribution_mister ?? {};
	});

	function handleLoad() {
		dispatch(loadDb('distribution_mister'));
	}

	return (
		<div>
			<h2 className="text-red-700">distribution_mister</h2>
			<input type="text" />
			<button onClick={handleLoad}>Load</button>
			<pre>{JSON.stringify(db, null, 2)}</pre>
		</div>
	);
}

export { DB };
