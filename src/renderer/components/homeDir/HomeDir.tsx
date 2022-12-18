import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../store';
import { loadHomeDirFiles } from './homeDirSlice';

function HomeDir() {
	useEffect(() => {
		dispatch(loadHomeDirFiles());
	}, []);

	const files = useSelector((s: AppState) => {
		return s.homeDir.files;
	});

	return (
		<div>
			<h2>home dir</h2>
			<ul>
				{files.map((f) => (
					<li>{f}</li>
				))}
			</ul>
		</div>
	);
}

export { HomeDir };
