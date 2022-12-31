import React from 'react';
import { FolderIcon, MisterKunIcon } from '../../../icons';
import { BaseFeedbackModal } from '../../BaseFeedbackModal';
import { ExportType } from '../exportSlice';

type ExportModalProps = {
	exportType: ExportType;
	isOpen: boolean;
	message?: string;
	complete?: boolean;
	onClose: () => void;
};

function ExportModal({
	isOpen,
	message,
	complete,
	onClose,
	exportType,
}: ExportModalProps) {
	const title =
		exportType === 'directory'
			? 'Exporting To Directory...'
			: 'Exporting To MiSTer...';
	const icon = exportType === 'directory' ? FolderIcon : MisterKunIcon;

	return (
		<BaseFeedbackModal
			className="h-52"
			isOpen={isOpen}
			title={title}
			okButtonEnabled={!!complete}
			onOkClick={onClose}
			icon={icon}
		>
			{message && <p className="text-sm text-gray-500">{message}</p>}
		</BaseFeedbackModal>
	);
}

export { ExportModal };
