import React from 'react';
import { useDrag } from 'react-dnd';
import { dispatch } from '../../../store';
import { setDetailEntry } from '../catalogSlice';
import { CatalogEntry, PublicCatalogEntryProps } from './CatalogEntry';

function ConnectedCatalogEntry(props: PublicCatalogEntryProps) {
	const [_collected, dragRef] = useDrag(
		() => ({
			type: 'CatalogEntry',
			item: {
				node: {
					title: props.entry.gameName,
					db_id: props.entry.db_id,
					mraFileName: props.entry.files.mra.fileName,
				},
			},
		}),
		[]
	);

	function handleClick() {
		dispatch(setDetailEntry(props.entry));
	}

	return (
		<div ref={dragRef}>
			{' '}
			<CatalogEntry {...props} onClick={handleClick} />
		</div>
	);
}

export { ConnectedCatalogEntry };
