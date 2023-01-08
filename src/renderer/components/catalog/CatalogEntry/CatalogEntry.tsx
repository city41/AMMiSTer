import React from 'react';
import clsx from 'clsx';
import type { CatalogEntry as CatalogEntryType } from '../../../../main/catalog/types';
import { FavoriteIcon, NotFavoriteIcon, DangerIcon } from '../../../icons';

type PublicCatalogEntryProps = {
	className?: string;
	entry: CatalogEntryType;
	hideIcons?: boolean;
	hideInPlan?: boolean;
};

type InternalCatalogEntryProps = {
	onClick?: () => void;
	isInPlan?: boolean;
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
			title={orientation}
			className={clsx('rounded-sm border border-indigo-500 w-4 h-3', {
				'transform rotate-90': orientation === 'vertical',
			})}
		/>
	);
}

function CatalogEntry({
	className,
	entry,
	hideIcons,
	isInPlan,
	hideInPlan,
	onClick,
}: PublicCatalogEntryProps & InternalCatalogEntryProps) {
	const FavIcon = entry.favorite ? FavoriteIcon : NotFavoriteIcon;
	const missingFile =
		!entry.files.mra ||
		!entry.files.rbf ||
		(entry.files.roms.length > 0 && entry.files.roms.every((r) => !r.md5));

	return (
		<div className={clsx(className, 'px-2 py-1')}>
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
						<Monitor orientation={entry.orientation} />
						{typeof entry.favorite === 'boolean' && (
							<FavIcon
								className={clsx('w-5 h-5', {
									'text-gray-500': !entry.favorite,
									'text-orange-400': entry.favorite,
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
