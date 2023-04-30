import React from 'react';
import clsx from 'clsx';
import YouTube from 'react-youtube';
import StarRatingComponent from 'react-star-rating-component';
import { CatalogEntry } from '../../../../main/catalog/types';
import { Modal } from '../../Modal';

type EntryDetailModalProps = {
	isOpen: boolean;
	onRequestClose?: () => void;
	entry: CatalogEntry;
};

function formatSize(size: number | undefined): string | undefined {
	if (!size) {
		return;
	}

	const kilobytes = size / 1024;
	const megabytes = kilobytes / 1024;
	const gigabytes = megabytes / 1024;

	if (kilobytes < 1) {
		return `${size} bytes`;
	}

	if (megabytes < 1) {
		return `${kilobytes.toFixed(2)} kb`;
	}

	if (gigabytes < 1) {
		return `${megabytes.toFixed(2)} mb`;
	}

	return `${gigabytes.toFixed(2)} gb`;
}

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
		entry.files.rbf?.status === 'missing' ||
		entry.files.rbf?.status === 'unexpected-missing'
	) {
		rbfStatus = '(missing)';
	} else if (entry.files.rbf?.status === 'corrupt') {
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
					{[entry.manufacturer, entry.yearReleased, entry.region]
						.filter((s) => !!s?.toString().trim())
						.join(', ')}
				</p>
			</div>
			<div className="flex flex-col items-stretch">
				{!!(
					(entry.titleScreenshotUrl && entry.gameplayScreenshotUrl) ||
					entry.shortPlayVideoId
				) && (
					<div
						className={clsx(
							'overflow-x-auto overflow-y-hidden p-4 bg-gray-100 flex flex-row gap-x-4 border-t border-b border-gray-200',
							{
								'justify-evenly':
									!entry.shortPlayVideoId ||
									(!entry.titleScreenshotUrl && !entry.gameplayScreenshotUrl),
							}
						)}
					>
						{entry.titleScreenshotUrl && (
							<img
								className="max-h-72"
								alt={`Title Screen of ${entry.gameName}`}
								src={entry.titleScreenshotUrl ?? ''}
							/>
						)}
						{entry.gameplayScreenshotUrl && (
							<img
								className="max-h-72"
								alt={`Gameplay of ${entry.gameName}`}
								src={entry.gameplayScreenshotUrl ?? ''}
							/>
						)}
						{entry.shortPlayVideoId && (
							<YouTube className="max-h-72" videoId={entry.shortPlayVideoId} />
						)}
					</div>
				)}
				<dl className="bg-white">
					{entry.arcadeItaliaRating && (
						<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500">
								Arcade Italia Rating
							</dt>
							<dd>
								<StarRatingComponent
									name="arcadeItaliaRating"
									value={entry.arcadeItaliaRating / 10}
									starCount={10}
									editing={false}
								/>
							</dd>
						</div>
					)}
					{entry.category?.length > 0 && (
						<div className="even:bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500">
								Categor{entry.category.length > 1 ? 'ies' : 'y'}
							</dt>
							<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
								{entry.category.join(', ')}
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
										{entry.rotation !== 0 || entry.flip
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
							className={clsx(
								'mt-1 text-sm sm:col-span-2 sm:mt-0 flex flex-row gap-x-2 items-baseline',
								{
									'italic text-gray-500': entry.files.mra.status !== 'ok',
									'text-gray-900': entry.files.mra.status === 'ok',
								}
							)}
						>
							<div>
								{entry.files.mra.fileName} {mraStatus}
							</div>
							<div className="text-xs ml-2 text-gray-500 italic">
								{formatSize(entry.files.mra.size)}
							</div>
						</dd>
					</div>
					{!!entry.files.rbf && (
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
								className={clsx(
									'mt-1 text-sm sm:col-span-2 sm:mt-0 flex flex-row gap-x-2 items-baseline',
									{
										'italic text-gray-500':
											!entry.files.rbf || entry.files.rbf.status !== 'ok',
										'text-gray-900':
											entry.files.rbf && entry.files.rbf.status === 'ok',
									}
								)}
							>
								<div>
									{entry.files.rbf?.relFilePath} {rbfStatus}{' '}
								</div>
								<div className="text-xs ml-2 text-gray-500 italic">
									{formatSize(entry.files.rbf?.size)}
								</div>
							</dd>
						</div>
					)}
					{entry.files.roms.map((r) => {
						let statusText = '';

						if (r.status === 'missing' || r.status === 'unexpected-missing') {
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
										'text-red-700': r.status !== 'ok',
									})}
								>
									ROM
								</dt>
								<dd
									className={clsx(
										'mt-1 text-sm sm:col-span-2 sm:mt-0 flex flex-row gap-x-2 items-baseline',
										{
											'italic text-gray-500': r.status !== 'ok',
											'text-gray-900': r.status === 'ok',
										}
									)}
								>
									<div>
										{r.relFilePath} {statusText}
									</div>
									<div className="text-xs ml-2 text-gray-500 italic">
										{formatSize(r.size)}
									</div>
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
