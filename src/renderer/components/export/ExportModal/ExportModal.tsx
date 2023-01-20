import React from 'react';
import { FolderIcon, MisterKunIcon } from '../../../icons';
import { BaseFeedbackModal } from '../../BaseFeedbackModal';
import { ExportError, ExportType } from '../../../../main/export/types';

type ExportModalProps = {
	exportType: ExportType;
	isOpen: boolean;
	message?: string;
	error?: ExportError;
	complete?: boolean;
	onClose: () => void;
};

function ExportModal({
	isOpen,
	message,
	error,
	complete,
	onClose,
	exportType,
}: ExportModalProps) {
	const title =
		exportType === 'directory'
			? 'Exporting To Directory...'
			: 'Exporting To MiSTer...';
	const icon = exportType === 'directory' ? FolderIcon : MisterKunIcon;

	let body = null;

	if (error) {
		let errorTitle = '';
		let errorMessage = '';
		switch (error.type) {
			case 'connect-fail': {
				errorTitle = 'Failed to connect';
				errorMessage =
					'Please check that the MiSter is on the network, and the login info was entered correctly';
				break;
			}
			case 'file-error': {
				errorTitle = 'File Error';
				errorMessage = `An error occured with ${error.fileOp?.action} of ${error.fileOp?.destPath}`;
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
	} else if (message) {
		body = <p className="text-sm text-gray-500">{message}</p>;
	}

	return (
		<BaseFeedbackModal
			className="h-52"
			isOpen={isOpen}
			title={title}
			okButtonEnabled={!!complete || !!error}
			onOkClick={onClose}
			icon={icon}
			errorOccured={!!error}
		>
			{body}
		</BaseFeedbackModal>
	);
}

export { ExportModal };
