import React from 'react';
import clsx from 'clsx';
import type { CatalogEntry as CatalogEntryType } from '../../../../main/db/types';
import { FavoriteIcon, NotFavoriteIcon, ScreenIcon } from '../../../icons';

type CatalogEntryProps = {
	entry: CatalogEntryType;
};

type FileKey = keyof CatalogEntryType['files'];

const filesToKey: Record<FileKey, string> = {
	mra: 'M',
	rbf: 'C',
	rom: 'R',
};

function CatalogEntry({ entry }: CatalogEntryProps) {
	const FavIcon = entry.favorite ? FavoriteIcon : NotFavoriteIcon;
	return (
		<div className="bg-gray-300 p-1 border border-l-gray-400 border-b-gray-400 border-t-white border-r-white">
			<h3 className="whitespace-nowrap text-ellipsis overflow-hidden text-base font-bold">
				{entry.gameName}
			</h3>
			<div className="flex flex-row justify-between">
				<div className="text-xs text-gray-500">
					{entry.manufacturer.join(',')} {entry.yearReleased}{' '}
				</div>
				<div className="text-xs pr-1 flex flex-row items-center gap-x-0.5">
					{entry.orientation && (
						<div className="relative w-5 h-5">
							<ScreenIcon
								className={clsx('w-full h-full', {
									'transform rotate-90': entry.orientation === 'vertical',
								})}
							/>
							<div
								className="absolute top-0 left-0 w-5 h-5 grid place-items-center"
								style={{ fontSize: entry.orientation === 'vertical' ? 11 : 10 }}
							>
								{entry.orientation[0]}
							</div>
						</div>
					)}
					{Object.entries(filesToKey).map((e) => {
						return (
							<div
								className={clsx('px-0.5', {
									'bg-green-400 text-green-800': !!entry.files[e[0] as FileKey],
									'bg-red-400 text-red-800': !entry.files[e[0] as FileKey],
								})}
							>
								{e[1]}
							</div>
						);
					})}
					<FavIcon
						className={clsx('w-5 h-5', {
							'text-gray-500': !entry.favorite,
							'text-orange-400': entry.favorite,
						})}
					/>
				</div>
			</div>
		</div>
	);
}

export { CatalogEntry };
