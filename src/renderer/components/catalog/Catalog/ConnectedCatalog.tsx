import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AppState, dispatch } from '../../../store';
import { getCurrentCatalog, updateCatalog } from '../catalogSlice';
import { Catalog } from './Catalog';
import { CatalogEmptyState } from './CatalogEmptyState';
import { CatalogLoading } from './CatalogLoading';

function ConnectedCatalog() {
	useEffect(() => {
		dispatch(getCurrentCatalog());
	}, []);

	const catalog = useSelector((s: AppState) => {
		return s.catalog.catalog;
	});

	const settings = useSelector((s: AppState) => {
		return s.settings.settings;
	});

	function handleBuildCatalog() {
		dispatch(updateCatalog());
	}

	// main hasn't sent us the catalog yet, we dont yet know
	// if there is one. Due to auditing the catalog taking a bit,
	// we will pop a loading state
	if (catalog === undefined) {
		return <CatalogLoading />;
	}

	// still waiting for the settings from main. This should virtually never
	//  happen but still good to guard against
	if (!settings) {
		return null;
	}

	if (catalog === null) {
		return <CatalogEmptyState onClick={handleBuildCatalog} />;
	}

	return (
		<Catalog catalog={catalog} updateDbConfigs={settings?.updateDbs ?? []} />
	);
}

export { ConnectedCatalog };
