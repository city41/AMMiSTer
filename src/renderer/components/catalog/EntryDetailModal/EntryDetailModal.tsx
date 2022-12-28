import React from 'react';
import { CatalogEntry } from '../../../../main/db/types';
import { Modal } from '../../Modal';

type EntryDetailModalProps = {
	isOpen: boolean;
	onRequestClose?: () => void;
	entry: CatalogEntry;
};

function GridHeader({ children }: { children: React.ReactNode }) {
	return (
		<div className="bg-blue-800 text-white px-2 py-1 text-right">
			{children}
		</div>
	);
}

function GridContent({ children }: { children: React.ReactNode }) {
	return <div className="bg-gray-200 text-gray-800 px-2 py-1">{children}</div>;
}

function EntryDetailModal({
	isOpen,
	onRequestClose,
	entry,
}: EntryDetailModalProps) {
	return (
		<Modal isOpen={isOpen} onRequestClose={onRequestClose}>
			<h1 className="w-full px-4 py-2 mb-8 bg-slate-900 text-slate-100 flex flex-row justify-between items-center">
				<div className="text-lg font-bold">{entry.gameName}</div>
				<div className="text-slate-500 text-sm">{entry.db_id}</div>
			</h1>
			<div className="flex flex-col gap-y-8 items-center">
				<div className="flex flex-row justify-evenly">
					<img
						className="max-h-72"
						alt={`Title Screen of ${entry.gameName}`}
						src={entry.titleScreenshotUrl ?? ''}
					/>
					<img
						className="max-h-72"
						alt={`Gameplay of ${entry.gameName}`}
						src={entry.gameplayScreenshotUrl ?? ''}
					/>
				</div>
				<div className="grid grid-cols-2 gap-x-1 gap-y-1 w-3/4">
					<GridHeader>Title</GridHeader>
					<GridContent>{entry.gameName}</GridContent>
					<GridHeader>Manufacturer</GridHeader>
					<GridContent>{entry.manufacturer}</GridContent>
					<GridHeader>Year</GridHeader>
					<GridContent>{entry.yearReleased}</GridContent>
					<GridHeader>MAME Version</GridHeader>
					<GridContent>{entry.mameVersion}</GridContent>
					<GridHeader>MAME ROM</GridHeader>
					<GridContent>{entry.rom}.zip</GridContent>
					<GridHeader>Orientation</GridHeader>
					<GridContent>{entry.orientation ?? '?'}</GridContent>
				</div>
				<div className="grid grid-cols-2 gap-x-1 gap-y-1 w-3/4">
					<GridHeader>MRA</GridHeader>
					<GridContent>{entry.files.mra?.fileName ?? 'missing'}</GridContent>
					<GridHeader>Core</GridHeader>
					<GridContent>{entry.files.rbf?.fileName ?? 'missing'}</GridContent>
					<GridHeader>ROM</GridHeader>
					<GridContent>{entry.files.rom?.fileName ?? 'missing'}</GridContent>
				</div>
			</div>
		</Modal>
	);
}

export { EntryDetailModal };
