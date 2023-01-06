import React from 'react';
import clsx from 'clsx';

type InternalWelcomeProps = {
	appVersion: string;
	onDismiss: () => void;
};

type PublicWelcomeProps = {
	className?: string;
};

function Welcome({
	className,
	appVersion,
	onDismiss,
}: InternalWelcomeProps & PublicWelcomeProps) {
	const isAlpha = appVersion.startsWith('0.');

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
			{isAlpha && (
				<div className="mt-6 rounded p-2 pb-4 -m-2 bg-red-200 flex flex-col gap-y-2">
					<h2 className="text-xl font-medium text-red-800">
						This is an alpha version!
					</h2>
					<p>
						This is an early version of AMMiSTer. More features, improvements
						and bug fixes are coming.
					</p>
					<h2 className="text-xl font-medium text-red-800">Alternative ROMs</h2>
					<p>
						AMMister does not support alternative ROMs. If you use those, don't
						export to your MiSTer. You can export to a directory to play with
						the app.
					</p>
					<p className="mt-8">
						Check the{' '}
						<a
							href="https://github.com/city41/AMMiSTer/blob/main/RELEASE_NOTES.md"
							target="_blank"
							rel="noreferrer"
							className="text-blue-600 underline cursor-pointer"
						>
							release notes
						</a>{' '}
						for more info.
					</p>
				</div>
			)}
			<div className="mt-6 rounded p-2 pb-4 -m-2 bg-white flex flex-col gap-y-2">
				<h2 className="text-lg font-medium">update_all warning</h2>
				<p>
					update_all and AMMiSter update your arcade games from the same
					sources, and will conflict with each other. If you are going to use
					AMMiSTer, then you must turn off arcade core updates for update_all.
				</p>
				<p>
					Keep using update_all for all other types of updates. Don't worry,
					AMMiSTer will keep your arcade games updated just like update_all
					would have.
				</p>
			</div>
			<div className="mt-6 rounded p-2 pb-4 -m-2 bg-white flex flex-col gap-y-2">
				<h2 className="text-lg font-medium">
					Make your first export to MiSTer faster
				</h2>
				<p>
					On your MiSTer, deleting <code>_Arcade/_Organized</code> if it exists
					will make the first export faster.
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
