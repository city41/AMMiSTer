import React from 'react';
import clsx from 'clsx';
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
			case 'network-error': {
				errorTitle = 'Network Error';
				errorMessage = error.message ?? '';
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
	} else if (canceled) {
		body = (
			<p className="text-sm text-gray-500">Build catalog/update canceled</p>
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
				const failedUpdateCount = updates.filter((u) => u.error).length;
				let errorMessage = '';
				if (failedUpdateCount === 1) {
					errorMessage = '1 update failed';
				} else {
					errorMessage = `${failedUpdateCount} updates failed`;
				}

				body = (
					<div className="flex flex-col gap-y-2">
						{failedUpdateCount > 0 && (
							<h3 className="text-red-800">however, {errorMessage}</h3>
						)}
						<ul className="flex flex-col gap-y-1 mt-4">
							{updates.map((u) => (
								<li
									key={u.fileEntry.fileName}
									className={clsx(
										'text-sm text-gray-500 grid grid-cols-6 gap-x-2 mb-4'
									)}
								>
									<div
										className={clsx('border-r-2 row-span-2 text-right pr-2', {
											'border-green-600': !u.error,
											'border-red-600': u.error,
										})}
									>
										{u.fileEntry.type === 'rbf' ? 'core' : u.fileEntry.type}:
									</div>
									<div
										className="font-bold"
										style={{ gridColumn: '2/6', gridRow: 1 }}
									>
										{u.fileEntry.fileName}
									</div>
									{u.error && (
										<div
											className="flex flex-row gap-x-2 bg-red-50"
											style={{ gridColumn: '2/6', gridRow: 2 }}
										>
											<div>An error occurred:</div>
											<div className="italic">{u.errorMessage}</div>
										</div>
									)}
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
			okButtonEnabled={updateComplete || canceled || !!error}
			onOkClick={onClose}
			onCancelClick={onCancelClick}
			cancelButtonEnabled={!canceled && !error && !Array.isArray(updates)}
			icon={GiftIcon}
			errorOccured={!!error || updates?.some((u) => u.error)}
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
