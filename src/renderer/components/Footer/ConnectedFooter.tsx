import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../store';

import { Footer, PublicFooterProps } from './Footer';

const PACKAGE_JSON_URL =
	'https://raw.githubusercontent.com/city41/AMMiSTer/main/package.json';

function ConnectedFooter(props: PublicFooterProps) {
	const [localVersion, setLocalVersion] = useState('');
	const [mainVersion, setMainVersion] = useState('');

	useEffect(() => {
		window.ipcAPI.getVersion().then((v) => {
			setLocalVersion(v);
		});

		// get latest version from main branch
		fetch(PACKAGE_JSON_URL)
			.then((r) => r.json())
			.then((packageJson) => {
				setMainVersion(packageJson.version);
			})
			.catch(() => {
				setMainVersion('');
			});
	}, []);

	const catalog = useSelector((state: AppState) => state.catalog.catalog);
	const { planPath, isDirty } = useSelector((state: AppState) => {
		return {
			planPath: state.plan.present.planPath,
			isDirty: state.plan.present.isDirty,
		};
	});

	return (
		<Footer
			{...props}
			updatedAt={catalog?.updatedAt}
			localVersion={localVersion}
			mainVersion={mainVersion}
			planPath={planPath}
			planIsDirty={isDirty}
		/>
	);
}

export { ConnectedFooter };
