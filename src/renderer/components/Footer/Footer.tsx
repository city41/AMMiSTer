import React from 'react';
import clsx from 'clsx';

type PublicFooterProps = {
	className?: string;
};

type InternalFooterProps = {
	updatedAt?: number;
	appVersion: string;
};

function Footer({
	className,
	updatedAt,
	appVersion,
}: PublicFooterProps & InternalFooterProps) {
	return (
		<div
			className={clsx(
				className,
				'h-8 bg-white border-t border-gray-200 px-4 py-1 flex flex-row items-center justify-between'
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
			{!!appVersion && (
				<a
					href="https://github.com/city41/AMMiSTer/blob/main/RELEASE_NOTES.md"
					target="_blank"
					rel="noreferrer"
					className="text-xs text-blue-600 underline cursor-pointer"
				>
					v{appVersion}
				</a>
			)}
		</div>
	);
}

export { Footer };
export type { PublicFooterProps };
