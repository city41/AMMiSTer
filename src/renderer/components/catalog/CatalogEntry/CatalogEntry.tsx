import React from 'react';
import clsx from 'clsx';
import type { CatalogEntry as CatalogEntryType } from '../../../../main/catalog/types';
import { FavoriteIcon, NotFavoriteIcon, DangerIcon } from '../../../icons';

type PublicCatalogEntryProps = {
	className?: string;
	entry: CatalogEntryType;
	hideIcons?: boolean;
};

type InternalCatalogEntryProps = {
	onClick?: () => void;
};

function Monitor({
	orientation,
}: {
	orientation: 'vertical' | 'horizontal' | null;
}) {
	if (orientation === null) {
		return null;
	}

	return (
		<div
			className={clsx('w-4 h-3 rounded-sm border border-indigo-500', {
				'w-3 h-4': orientation === 'vertical',
				'w-4 h-3': orientation === 'horizontal',
			})}
		/>
	);
}

function CatalogEntry({
	className,
	entry,
	hideIcons,
	onClick,
}: PublicCatalogEntryProps & InternalCatalogEntryProps) {
	const FavIcon = entry.favorite ? FavoriteIcon : NotFavoriteIcon;
	const missingFile =
		!entry.files.mra ||
		!entry.files.rbf ||
		(entry.files.roms.length > 0 && entry.files.roms.every((r) => !r.md5));

	return (
		<div className={clsx(className, 'px-2 py-1')}>
			<h3
				className="whitespace-nowrap text-ellipsis overflow-hidden font-medium hover:underline cursor-pointer"
				onClick={onClick}
			>
				{entry.gameName}
			</h3>
			<div className="flex flex-row justify-between">
				<div className="flex flex-row items-center gap-x-2 text-xs text-gray-500">
					{entry.manufacturer.join(',')} {entry.yearReleased}
				</div>
				{!hideIcons && (
					<div className="text-xs pr-1 flex flex-row items-center gap-x-1">
						{missingFile && <DangerIcon className="w-5 h-5 text-red-700" />}
						<Monitor orientation={entry.orientation} />
						<FavIcon
							className={clsx('w-5 h-5', {
								'text-gray-500': !entry.favorite,
								'text-orange-400': entry.favorite,
							})}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

export { CatalogEntry };
export type { PublicCatalogEntryProps };
