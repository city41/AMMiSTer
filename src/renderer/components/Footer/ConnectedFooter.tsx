import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../store';

import { Footer, PublicFooterProps } from './Footer';

function ConnectedFooter(props: PublicFooterProps) {
	const catalog = useSelector((state: AppState) => state.catalog.catalog);

	return <Footer {...props} updatedAt={catalog?.updatedAt} />;
}

export { ConnectedFooter };
