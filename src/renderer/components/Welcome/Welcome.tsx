import React from 'react';
import clsx from 'clsx';

type InternalWelcomeProps = {
	onDismiss: () => void;
};

type PublicWelcomeProps = {
	className?: string;
};

function Welcome({
	className,
	onDismiss,
}: InternalWelcomeProps & PublicWelcomeProps) {
	return (
		<div
			className={clsx(className, 'rounded p-4 bg-yellow-100 text-sm shadow-lg')}
			style={{ maxWidth: 900 }}
		>
			<h1 className="flex flex-row justify-between">
				<div className="text-xl font-medium text-yellow-800">
					Welcome to AMMiSTer!
				</div>
				<a
					className="text-blue-600 text-sm cursor-pointer hover:underline"
					onClick={onDismiss}
				>
					Don't show this again
				</a>
			</h1>
			<div className="mt-6 rounded p-2 pb-4 -m-2 bg-white flex flex-col gap-y-2">
				<h2 className="text-lg font-medium ">update_all warning</h2>
				<p>
					update_all and AMMiSter update your arcade games from the same
					sources, and will conflict with each other. If you are going to use
					AMiSTer, then you must turn off arcade core updates for update_all.
				</p>
				<p>
					Keep using update_all for all other types of updates. Don't worry,
					AMMiSTer will keep your arcade games updated just like update_all
					would have.
				</p>
			</div>
			<div className="mt-6">
				<p>
					Is your MiSTer not on a network? You can still use "Export to
					Directory...", then copy that directory to a MiSTer.
				</p>
			</div>
		</div>
	);
}

export { Welcome };
export type { PublicWelcomeProps };
