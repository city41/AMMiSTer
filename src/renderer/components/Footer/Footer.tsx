import React from 'react';
import clsx from 'clsx';

type PublicFooterProps = {
	className?: string;
};

type InternalFooterProps = {
	updatedAt?: number;
};

function Footer({
	className,
	updatedAt,
}: PublicFooterProps & InternalFooterProps) {
	return (
		<div
			className={clsx(
				className,
				'h-8 bg-white border-t border-gray-200 px-4 py-1 flex flex-row items-center'
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
		</div>
	);
}

export { Footer };
export type { PublicFooterProps };
