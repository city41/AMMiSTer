import React from 'react';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../store';
import { loadMisterGames } from './misterSlice';

function MisterArcadeGames() {
	const games = useSelector((s: AppState) => {
		return s.mister.games;
	});

	function handleLoad() {
		dispatch(loadMisterGames('192.168.1.178'));
	}

	return (
		<div>
			<h2>MiSTer Games</h2>
			<input type="text" />
			<button onClick={handleLoad}>Load</button>
			<ul>
				{games.map((g) => (
					<li>{g}</li>
				))}
			</ul>
		</div>
	);
}

export { MisterArcadeGames };
