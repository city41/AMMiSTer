import React from 'react';
import { Update, UpdateError } from '../../../../main/catalog/types';
import { BaseFeedbackModal } from '../../BaseFeedbackModal';
import { DangerIcon, GiftIcon } from '../../../icons';

type InternalUpdateModalProps = {
	isOpen: boolean;
	message?: string;
	updates?: Update[] | null;
	fresh?: boolean;
	error?: UpdateError;
	onClose: () => void;
};

function UpdateModal({
	isOpen,
	message,
	updates,
	fresh,
	error,
	onClose,
}: InternalUpdateModalProps) {
	const updateComplete = Array.isArray(updates);

	let body = null;

	if (error) {
		let errorTitle = '';
		let errorMessage = '';
		switch (error.type) {
			case 'connect-fail': {
				errorTitle = 'Failed to connect';
				errorMessage = 'Please check your internet connection';
				break;
			}
			case 'file-error': {
				errorTitle = 'File Error';
				errorMessage = `An error occured with ${error.fileEntry?.fileName}`;
				break;
			}
			case 'unknown': {
				errorTitle = 'Something happened';
				errorMessage = `An unknown error occurred: ${
					error.message ?? 'unknown'
				}`;
				break;
			}
		}
		body = (
			<div className="flex flex-col gap-y-2 items-start">
				<h3 className="font-bold text-red-800">{errorTitle}</h3>
				<p className="text-sm text-gray-500">{errorMessage}</p>
			</div>
		);
	} else {
		if (Array.isArray(updates)) {
			if (updates.length === 0) {
				body = (
					<p className="text-sm text-gray-500">
						Update check complete, nothing new to update
					</p>
				);
			} else {
				body = (
					<div>
						<ul>
							{updates.map((u) => (
								<li
									key={u.fileEntry.fileName}
									className="text-sm text-gray-500 flex flex-row gap-x-2"
								>
									<div className="text-gray-800">
										{u.fileEntry.type === 'rbf' ? 'core' : u.fileEntry.type}:
									</div>
									<div>{u.fileEntry.fileName}</div>
								</li>
							))}
						</ul>
					</div>
				);
			}
		} else {
			body = <p className="text-sm text-gray-500">{message}</p>;
		}
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
			errorOccured={!!error}
		>
			<>
				{body}
				{fresh && (
					<div className="mt-4 flex flex-row items-center gap-x-2">
						<DangerIcon className="w-9 h-9 text-red-500" />
						<div className="text-sm flex flex-col gap-y-1">
							<div>This is the first time updating.</div>
							<div>
								Expect this to take 10-30+ minutes with a good internet
								connection.
							</div>
							<div>After this one, updates will be quick.</div>
						</div>
					</div>
				)}
			</>
		</BaseFeedbackModal>
	);
}

export { UpdateModal };
