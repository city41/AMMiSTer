import React from 'react';
import clsx from 'clsx';
import { CatalogEntry } from '../../../../main/catalog/types';
import { Modal } from '../../Modal';

type EntryDetailModalProps = {
	isOpen: boolean;
	onRequestClose?: () => void;
	entry: CatalogEntry;
};

function EntryDetailModal({
	isOpen,
	onRequestClose,
	entry,
}: EntryDetailModalProps) {
	return (
		<Modal isOpen={isOpen} closeButton onRequestClose={onRequestClose}>
			<div
				className="px-4 py-5 sm:px-6"
				style={{ minWidth: '80vw', maxWidth: 900 }}
			>
				<h1 className="text-lg font-medium leading-6 text-gray-900">
					{entry.gameName}
				</h1>
				<p className="mt-1 max-w-2xl text-sm text-gray-500">
					{entry.manufacturer} {entry.yearReleased}
				</p>
			</div>
			<div className="flex flex-col items-stretch">
				{entry.titleScreenshotUrl && entry.gameplayScreenshotUrl && (
					<div className="p-4 bg-gray-100 flex flex-row gap-x-4 justify-evenly border-t border-b border-gray-200">
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
				)}
				<dl className="bg-white">
					{entry.categories.length > 0 && (
						<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500">
								Categor{entry.categories.length > 1 ? 'ies' : 'y'}
							</dt>
							<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
								{entry.categories.join(', ')}
							</dd>
						</div>
					)}
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">MAME Version</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{entry.mameVersion}
						</dd>
					</div>
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Orientation</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{entry.orientation}
						</dd>
					</div>
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">MRA</dt>
						<dd
							className={clsx(
								'mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0',
								{
									italic: !entry.files.mra,
								}
							)}
						>
							{entry.files.mra.fileName}
						</dd>
					</div>
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt
							className={clsx('text-sm font-medium text-gray-500', {
								'text-red-700': !entry.files.rbf,
							})}
						>
							Core (RBF)
						</dt>
						<dd
							className={clsx(
								'mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0',
								{
									'italic text-gray-400': !entry.files.rbf,
								}
							)}
						>
							{entry.files.rbf?.relFilePath ?? 'missing'}
						</dd>
					</div>
					{entry.files.roms.map((r) => {
						return (
							<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt
									className={clsx('text-sm font-medium text-gray-500', {
										'text-red-700': !r.md5,
									})}
								>
									ROM
								</dt>
								<dd
									className={clsx(
										'mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0',
										{
											'italic text-gray-400': !r.md5,
										}
									)}
								>
									{r.relFilePath} {r.md5 ? '' : '(missing)'}
								</dd>
							</div>
						);
					})}
				</dl>
			</div>
		</Modal>
	);
}

export { EntryDetailModal };
