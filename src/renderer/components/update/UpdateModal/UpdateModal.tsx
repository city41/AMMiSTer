import React from 'react';
import clsx from 'clsx';
import { Update } from '../../../../main/catalog/types';
import { Modal } from '../../Modal';
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
		<Modal isOpen={isOpen}>
			<div
				className="rounded-lg bg-white grid h-full"
				style={{ width: '55vw', gridTemplateRows: '1fr max-content' }}
			>
				<div className="bg-white p-6 pb-4 h-full overflow-auto">
					<div className="flex flex-row items-start">
						<div className="flex h-12 w-12 p-2 items-center justify-center rounded-full bg-indigo-50">
							<GiftIcon className="text-indigo-300" />
						</div>
						<div className="mt-0 ml-4 flex flex-col gap-y-2">
							<h3 className="text-lg font-medium leading-6 text-gray-900">
								{title}
							</h3>
							{message && !updateComplete && (
								<p className="text-sm text-gray-500">{message}</p>
							)}
							{updateComplete && (
								<ul className="ml-4 flex flex-col gap-y-2 list-disc">
									{updates.map((u) => (
										<li className="text-sm text-gray-500 flex flex-row gap-x-2">
											<div className="text-gray-800">
												{u.fileEntry.type === 'rbf' ? 'core' : u.fileEntry.type}
												:
											</div>
											<div>{u.fileEntry.fileName}</div>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</div>
				<div className="bg-gray-50 px-6 py-3 flex flex-row-reverse">
					<button
						type="button"
						disabled={!updateComplete}
						onClick={onClose}
						className={clsx(
							'rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm shadow-sm',
							{
								'bg-indigo-600 text-white': updateComplete,
								'bg-gray-300 text-gray-400': !updateComplete,
							}
						)}
					>
						Okay
					</button>
				</div>
			</div>
		</Modal>
	);
}

export { UpdateModal };
