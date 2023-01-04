import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../store';

import { Footer, PublicFooterProps } from './Footer';

function ConnectedFooter(props: PublicFooterProps) {
	const [version, setVersion] = useState('');

	useEffect(() => {
		window.ipcAPI.getVersion().then((v) => {
			setVersion(v);
		});
	}, []);

	const catalog = useSelector((state: AppState) => state.catalog.catalog);

	return (
		<Footer {...props} updatedAt={catalog?.updatedAt} appVersion={version} />
	);
}

export { ConnectedFooter };
