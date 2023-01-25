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
	let mraStatus = '';
	let rbfStatus = '';

	if (entry.files.mra.status === 'corrupt') {
		mraStatus = '(corrupt)';
	} else if (entry.files.mra.status !== 'ok') {
		mraStatus = '(missing)';
	}

	if (
		!entry.files.rbf ||
		entry.files.rbf.status === 'missing' ||
		entry.files.rbf.status === 'unexpected-missing'
	) {
		rbfStatus = '(missing)';
	} else if (entry.files.rbf.status === 'corrupt') {
		rbfStatus = '(corrupt)';
	}

	return (
		<Modal isOpen={isOpen} closeButton onRequestClose={onRequestClose}>
			<div
				className="px-4 py-4 sm:px-6"
				style={{ minWidth: '80vw', maxWidth: 900 }}
			>
				<h1 className="text-lg font-medium leading-6 text-gray-900">
					{entry.gameName}
				</h1>
				<p className="mt-1 max-w-2xl text-sm text-gray-500">
					{entry.manufacturer}, {entry.yearReleased}
					{entry.region ? ',' : ''} {entry.region}
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
					{entry.categories?.length > 0 && (
						<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500">
								Categor{entry.categories.length > 1 ? 'ies' : 'y'}
							</dt>
							<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
								{entry.categories.join(', ')}
							</dd>
						</div>
					)}
					{entry.series?.length > 0 && (
						<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500">Series</dt>
							<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
								{entry.series.join(', ')}
							</dd>
						</div>
					)}
					{entry.players && (
						<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500">Players</dt>
							<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
								{entry.players}
							</dd>
						</div>
					)}
					{(entry.num_buttons ||
						entry.move_inputs?.length > 0 ||
						entry.special_controls?.length > 0) && (
						<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500">Controls</dt>
							<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
								{(entry.special_controls ?? []).join(', ')}
								{entry.special_controls?.length > 0 &&
								(entry.move_inputs?.length > 0 || entry.num_buttons)
									? ', '
									: ''}
								{(entry.move_inputs ?? []).join(', ')}
								{entry.move_inputs?.length > 0 ? ',' : ''}
								{!!entry.num_buttons && (
									<span>
										{' '}
										{entry.num_buttons} button
										{entry.num_buttons === 1 ? '' : 's'}
									</span>
								)}
							</dd>
						</div>
					)}
					{(typeof entry.rotation === 'number' || entry.resolution) && (
						<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500">Monitor</dt>
							<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
								{typeof entry.rotation === 'number' && (
									<span>
										{entry.rotation === 0 ? 'Horizontal' : 'Vertical'}
										{entry.rotation !== 0
											? ` (${entry.rotation}deg${
													entry.flip ? ', flippable' : ''
											  })`
											: ''}
									</span>
								)}
								<span>
									{entry.rotation !== null && !!entry.resolution ? ', ' : ''}
									{entry.resolution ? `${entry.resolution}` : ''}
								</span>
							</dd>
						</div>
					)}
					<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">MAME Version</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{entry.mameVersion}{' '}
							{entry.romSlug && <span>({entry.romSlug})</span>}
						</dd>
					</div>
					{entry.platform?.length > 0 && (
						<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500">Platform</dt>
							<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
								{entry.platform.join(', ')}
							</dd>
						</div>
					)}
					<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt
							className={clsx('text-sm font-medium text-gray-500', {
								'text-red-700': entry.files.mra.status !== 'ok',
							})}
						>
							MRA
						</dt>
						<dd
							className={clsx('mt-1 text-sm sm:col-span-2 sm:mt-0', {
								'italic text-gray-500': entry.files.mra.status !== 'ok',
								'text-gray-900': entry.files.mra.status === 'ok',
							})}
						>
							{entry.files.mra.fileName} {mraStatus}
						</dd>
					</div>
					<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt
							className={clsx('text-sm font-medium text-gray-500', {
								'text-red-700':
									!entry.files.rbf || entry.files.rbf.status !== 'ok',
							})}
						>
							Core (RBF)
						</dt>
						<dd
							className={clsx('mt-1 text-sm sm:col-span-2 sm:mt-0', {
								'italic text-gray-500':
									!entry.files.rbf || entry.files.rbf.status !== 'ok',
								'text-gray-900':
									entry.files.rbf && entry.files.rbf.status === 'ok',
							})}
						>
							{entry.files.rbf?.relFilePath} {rbfStatus}
						</dd>
					</div>
					{entry.files.roms.map((r) => {
						let statusText = '';

						if (!r.md5) {
							statusText = '(missing)';
						} else if (r.status === 'corrupt') {
							statusText = '(corrupt)';
						}

						return (
							<div
								key={r.fileName}
								className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
							>
								<dt
									className={clsx('text-sm font-medium text-gray-500', {
										'text-red-700': !r.md5 || r.status !== 'ok',
									})}
								>
									ROM
								</dt>
								<dd
									className={clsx('mt-1 text-sm sm:col-span-2 sm:mt-0', {
										'italic text-gray-500': !r.md5 || r.status !== 'ok',
										'text-gray-900': r.status === 'ok',
									})}
								>
									{r.relFilePath} {statusText}
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
