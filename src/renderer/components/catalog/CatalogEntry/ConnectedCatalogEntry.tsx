import React from 'react';
import { dispatch } from '../../../store';
import { setDetailEntry } from '../catalogSlice';
import { CatalogEntry, PublicCatalogEntryProps } from './CatalogEntry';

function ConnectedCatalogEntry(props: PublicCatalogEntryProps) {
	function handleClick() {
		dispatch(setDetailEntry(props.entry));
	}

	return <CatalogEntry {...props} onClick={handleClick} />;
}

export { ConnectedCatalogEntry };
