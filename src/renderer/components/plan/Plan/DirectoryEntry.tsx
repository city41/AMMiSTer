import React from 'react';
import clsx from 'clsx';
import { PlanGameDirectoryEntry } from 'src/main/plan/types';
import { FolderIcon } from '../../../icons';

type DirectoryEntryProps = {
	className?: string;
	directory: PlanGameDirectoryEntry;
};

function DirectoryEntry({ className, directory }: DirectoryEntryProps) {
	return (
		<div className={clsx(className, 'flex flex-row gap-x-2')}>
			<FolderIcon className="w-5 h-5" />
			<div>{directory.directoryName}</div>
		</div>
	);
}

export { DirectoryEntry };
