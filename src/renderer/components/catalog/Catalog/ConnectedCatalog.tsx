import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../../store';
import { getCurrentCatalog, updateCatalog } from '../catalogSlice';
import { Catalog } from './Catalog';
import { CatalogEmptyState } from './CatalogEmptyState';

function ConnectedCatalog() {
	useEffect(() => {
		dispatch(getCurrentCatalog());
	}, []);

	const catalog = useSelector((s: AppState) => {
		return s.catalog.catalog;
	});

	function handleBuildCatalog() {
		dispatch(updateCatalog());
	}

	// main hasn't sent us the catalog yet, we dont yet know
	// if there is one. Since this only takes a second or so,
	// the "loading state" is just blank
	if (catalog === undefined) {
		return null;
	}

	if (catalog === null) {
		return <CatalogEmptyState onClick={handleBuildCatalog} />;
	}

	return <Catalog catalog={catalog} />;
}

export { ConnectedCatalog };
