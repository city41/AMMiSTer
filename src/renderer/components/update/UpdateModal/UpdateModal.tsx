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
	duration?: number;
	canceled?: boolean;
	onClose: () => void;
	onCancelClick: () => void;
};

function UpdateModal({
	isOpen,
	message,
	updates,
	fresh,
	error,
	duration,
	canceled,
	onClose,
	onCancelClick,
}: InternalUpdateModalProps) {
	const updateComplete = Array.isArray(updates);

	let body = null;

	if (canceled) {
		body = <p className="text-sm text-gray-500">Build catalog canceled</p>;
	} else if (error) {
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
			let durationEl = null;

			if (typeof duration === 'number') {
				const seconds = duration / 1000;
				const minutes = seconds / 60;

				const durMsg =
					minutes < 1
						? `${Math.round(seconds)} seconds`
						: `${minutes.toFixed(2)} minutes`;

				durationEl = (
					<div className="text-xs text-gray-400 mt-4">took {durMsg}</div>
				);
			}

			if (updates.length === 0) {
				body = (
					<>
						<p className="text-sm text-gray-500">
							Update check complete, nothing new to update
						</p>
						{durationEl}
					</>
				);
			} else {
				body = (
					<div className="flex flex-col gap-y-2">
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
						{durationEl}
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
			okButtonEnabled={updateComplete || canceled}
			onOkClick={onClose}
			onCancelClick={onCancelClick}
			cancelButtonEnabled={!canceled && !Array.isArray(updates)}
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
								Expect this to take 5-20+ minutes with a good internet
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
