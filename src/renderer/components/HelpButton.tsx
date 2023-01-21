import React, { useState } from 'react';
import clsx from 'clsx';

function HelpButton({
	className,
	children,
	popupClassName,
}: {
	className?: string;
	children: React.ReactNode;
	popupClassName?: string;
}) {
	const [showHelp, setShowHelp] = useState(false);

	return (
		<button
			className={clsx(
				className,
				'relative text-blue-500 px-1 hover:bg-green-100'
			)}
			onClick={() => setShowHelp(true)}
		>
			?
			{showHelp && (
				<div
					className={clsx(
						popupClassName,
						'absolute bg-gray-200 text-gray-800 text-left text-xs p-3 w-60 z-10'
					)}
				>
					{children}{' '}
					<a
						className="inline-block ml-2 text-blue-700 font-medium hover:underline"
						onMouseDown={(e) => {
							e.stopPropagation();
							e.preventDefault();
							setShowHelp(false);
						}}
					>
						okay
					</a>
				</div>
			)}
		</button>
	);
}

export { HelpButton };
