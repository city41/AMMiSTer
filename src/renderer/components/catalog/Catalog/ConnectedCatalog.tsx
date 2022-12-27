import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../../store';
import { getCurrentCatalog } from '../catalogSlice';
import { Catalog } from './Catalog';

function ConnectedCatalog() {
	useEffect(() => {
		dispatch(getCurrentCatalog());
	}, []);

	const catalog = useSelector((s: AppState) => {
		return s.catalog.catalog;
	});

	if (catalog === null) {
		return null;
	}

	return <Catalog catalog={catalog} />;
}

export { ConnectedCatalog };
