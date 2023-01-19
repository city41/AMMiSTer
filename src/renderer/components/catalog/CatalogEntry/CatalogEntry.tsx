import React from 'react';
import clsx from 'clsx';
import type {
	CatalogEntry as CatalogEntryType,
	GameMetadata,
} from '../../../../main/catalog/types';
import { FavoriteIcon, NotFavoriteIcon, DangerIcon } from '../../../icons';

type PublicCatalogEntryProps = {
	className?: string;
	entry: CatalogEntryType;
	hideIcons?: boolean;
	hideInPlan?: boolean;
};

type InternalCatalogEntryProps = {
	isInPlan?: boolean;
	isFavorite?: boolean;
	downloadingRoms?: boolean;
	onClick?: () => void;
	onToggleFavorite: () => void;
};

function Monitor({ rotation }: { rotation: GameMetadata['rotation'] }) {
	if (typeof rotation !== 'number') {
		return null;
	}

	const title = rotation === 0 ? 'horizontal' : 'vertical';

	return (
		<div
			title={title}
			className={clsx('rounded-sm border border-indigo-500 w-4 h-3', {
				'transform rotate-90': rotation !== 0,
			})}
		/>
	);
}

function CatalogEntry({
	className,
	entry,
	hideIcons,
	isInPlan,
	isFavorite,
	downloadingRoms,
	hideInPlan,
	onClick,
	onToggleFavorite,
}: PublicCatalogEntryProps & InternalCatalogEntryProps) {
	const FavIcon = isFavorite ? FavoriteIcon : NotFavoriteIcon;
	const missingFile =
		!entry.files.mra ||
		!entry.files.rbf ||
		(downloadingRoms &&
			entry.files.roms.length > 0 &&
			entry.files.roms.every((r) => !r.md5));

	return (
		<div className={className}>
			<div className="whitespace-nowrap text-ellipsis overflow-hidden">
				<h3
					className={clsx('inline font-medium hover:underline cursor-pointer', {
						'text-green-700': isInPlan && !hideInPlan,
					})}
					onClick={onClick}
				>
					{entry.gameName}
				</h3>
			</div>
			<div className="flex flex-row justify-between">
				<div className="flex flex-row font-normal items-center gap-x-2 text-xs text-gray-500">
					{entry.manufacturer.join(',')} {entry.yearReleased}
				</div>
				{!hideIcons && (
					<div className="text-xs pr-1 flex flex-row items-center gap-x-1">
						{missingFile && <DangerIcon className="w-5 h-5 text-red-700" />}
						<Monitor rotation={entry.rotation} />
						{typeof isFavorite === 'boolean' && (
							<FavIcon
								onClick={onToggleFavorite}
								className={clsx('w-5 h-5 cursor-pointer', {
									'text-gray-500': !isFavorite,
									'text-orange-400': isFavorite,
								})}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export { CatalogEntry };
export type { PublicCatalogEntryProps };
