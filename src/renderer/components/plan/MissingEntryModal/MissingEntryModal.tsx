import React from 'react';
import { PlanGameEntry } from '../../../../main/plan/types';
import { UpdateDbConfig } from '../../../../main/settings/types';
import { Modal } from '../../Modal';

type MissingEntryModalProps = {
	isOpen: boolean;
	onRequestClose?: () => void;
	entry: PlanGameEntry;
	updateDbConfigs: UpdateDbConfig[];
};

function MissingEntryModal({
	isOpen,
	onRequestClose,
	entry,
	updateDbConfigs,
}: MissingEntryModalProps) {
	const updateDbConfig = updateDbConfigs.find((u) => u.db_id === entry.db_id);
	const updateDbDisplayName = updateDbConfig?.displayName ?? '(unknown)';

	return (
		<Modal isOpen={isOpen} closeButton onRequestClose={onRequestClose}>
			<div className="py-4  px-6" style={{ minWidth: '80vw', maxWidth: 900 }}>
				<h1 className="text-lg font-medium leading-6 text-gray-900">
					Missing Game
				</h1>
				<p className="mt-1 max-w-2xl text-sm text-gray-500">
					{entry.relFilePath}
				</p>
			</div>
			<div className="py-4 px-6 flex flex-col gap-y-4 bg-red-50 text-sm">
				<p>This game is missing from the catalog, possible fixes:</p>
				<ul className="ml-8 mt-2 flex flex-col gap-y-4 list-disc">
					{updateDbConfig?.enabled === false && (
						<li>
							The update database,{' '}
							<span className="font-medium">{updateDbDisplayName}</span>, is
							disabled. Try re-enabling it then checking for updates.
						</li>
					)}
					<li>
						The MRA file name changed in an update. Try searching the catalog
						for the new entry, remove this one, and add that one.
					</li>
				</ul>
			</div>
		</Modal>
	);
	('');
}

export { MissingEntryModal };
