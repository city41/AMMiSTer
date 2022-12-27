import React from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../../store';
import { Catalog } from './Catalog';

function ConnectedCatalog() {
	const catalog = useSelector((s: AppState) => {
		return s.catalog.catalog;
	});

	if (catalog === null) {
		return null;
	}

	return <Catalog catalog={catalog} />;
}

export { ConnectedCatalog };
