import React from 'react';
import { PlanMissingEntry } from '../../../../../main/plan/types';
import { QuestionMarkCircleIcon } from '../../../../icons';

type PublicMissingEntryProps = {
	entry: PlanMissingEntry;
};

type InternalMissingEntryProps = {
	onClick: () => void;
};

function MissingEntry({
	entry,
	onClick,
}: PublicMissingEntryProps & InternalMissingEntryProps) {
	return (
		<div
			className="grid gap-x-2 py-2"
			style={{ gridTemplateColumns: 'max-content 1fr' }}
			onClick={onClick}
		>
			<QuestionMarkCircleIcon className="w-5 h-5 text-red-500" />
			<div className="text-sm italic font-light whitespace-nowrap text-ellipsis overflow-hidden hover:underline cursor-pointer">
				{entry.relFilePath}
			</div>
		</div>
	);
}

export { MissingEntry };
export type { PublicMissingEntryProps };
