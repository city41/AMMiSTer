import React from 'react';
import clsx from 'clsx';
import semVerCompare from 'semver-compare';
import { GiftIcon } from '../../icons';

type PublicFooterProps = {
	className?: string;
};

type InternalFooterProps = {
	updatedAt?: number;
	localVersion: string;
	mainVersion: string;
};

const RELEASES_PAGE = 'https://github.com/city41/AMMiSTer/releases';

function versionIsNewer(mainVersion: string, localVersion: string): boolean {
	if (!mainVersion.trim()) {
		return false;
	}

	return semVerCompare(mainVersion, localVersion) > 0;
}

function Footer({
	className,
	updatedAt,
	localVersion,
	mainVersion,
}: PublicFooterProps & InternalFooterProps) {
	return (
		<div
			className={clsx(
				className,
				'h-8 bg-white border-t border-gray-200 px-4 py-1 flex flex-row items-center justify-between gap-x-2'
			)}
		>
			{updatedAt && (
				<div className="text-xs text-gray-600">
					Last Check For Updates: {new Date(updatedAt).toDateString()} -{' '}
					{new Date(updatedAt).toLocaleString('en-us', {
						hour: 'numeric',
						minute: '2-digit',
						second: '2-digit',
					})}
				</div>
			)}
			<div className="flex-1" />
			{!!localVersion && (
				<a
					href="https://github.com/city41/AMMiSTer/blob/main/RELEASE_NOTES.md"
					target="_blank"
					rel="noreferrer"
					className="text-xs text-blue-600 underline cursor-pointer"
				>
					v{localVersion}
				</a>
			)}
			{versionIsNewer(mainVersion, localVersion) && (
				<>
					<GiftIcon className="text-green-700 w-4 h-4" />
					<div className="text-xs text-gray-500">
						new{' '}
						<a
							className="text-blue-600 underline cursor-pointer"
							href={RELEASES_PAGE}
							target="_blank"
							rel="noreferrer"
						>
							version
						</a>{' '}
						available
					</div>
				</>
			)}
		</div>
	);
}

export { Footer };
export type { PublicFooterProps };
