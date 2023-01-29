import React from 'react';
import { dispatch } from '../../../../store';
import { setMissingDetailEntry } from '../../planSlice';
import { MissingEntry, PublicMissingEntryProps } from './MissingEntry';

function ConnectedMissingEntry(props: PublicMissingEntryProps) {
	function handleClick() {
		dispatch(setMissingDetailEntry(props.entry));
	}

	return <MissingEntry {...props} onClick={handleClick} />;
}

export { ConnectedMissingEntry };
