import React from 'react';
import { Update } from '../../../../main/catalog/types';
import { Modal } from '../../Modal';

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

	return (
		<Modal isOpen={isOpen}>
			<div className="flex flex-col gap-y-2">
				<div className="flex flex-1">{body}</div>
				{Array.isArray(updates) && (
					<button className="px-4 py-2 border-1 border-black" onClick={onClose}>
						OK
					</button>
				)}
			</div>
		</Modal>
	);
}

export { UpdateModal };
