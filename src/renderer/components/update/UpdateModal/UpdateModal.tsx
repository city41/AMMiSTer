import React from 'react';
import { Update } from '../../../../main/catalog/types';
import { BaseFeedbackModal } from '../../BaseFeedbackModal';
import { GiftIcon } from '../../../icons';

type InternalUpdateModalProps = {
	isOpen: boolean;
	message?: string;
	updates?: Update[] | null;
	onClose: () => void;
};

function UpdateModal({
	isOpen,
	message,
	updates,
	onClose,
}: InternalUpdateModalProps) {
	const updateComplete = Array.isArray(updates);

	let body;

	if (Array.isArray(updates)) {
		if (updates.length === 0) {
			body = <p>Update complete, nothing new to update</p>;
		} else {
			body = (
				<div>
					<h3>Newly Updated</h3>
					<ul>
						{updates.map((u) => (
							<li key={u.fileEntry.fileName}>
								{u.fileEntry.fileName} ({u.updateReason})
							</li>
						))}
					</ul>
				</div>
			);
		}
	} else {
		body = <p>{message}</p>;
	}

	let title = 'Checking For Updates ...';
	if (updateComplete) {
		if (updates.length > 0) {
			title = 'Newly Updated';
		} else {
			title = 'No New Updates';
		}
	}

	return (
		<BaseFeedbackModal
			className="h-full"
			isOpen={isOpen}
			title={title}
			okButtonEnabled={updateComplete}
			onOkClick={onClose}
			icon={GiftIcon}
		>
			<>
				{message && !updateComplete && (
					<p className="text-sm text-gray-500">{message}</p>
				)}
				{updateComplete && (
					<ul className="ml-4 flex flex-col gap-y-2 list-disc">
						{updates.map((u) => (
							<li className="text-sm text-gray-500 flex flex-row gap-x-2">
								<div className="text-gray-800">
									{u.fileEntry.type === 'rbf' ? 'core' : u.fileEntry.type}:
								</div>
								<div>{u.fileEntry.fileName}</div>
							</li>
						))}
					</ul>
				)}
			</>
		</BaseFeedbackModal>
	);
}

export { UpdateModal };
