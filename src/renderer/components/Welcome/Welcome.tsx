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
	const isBeta = appVersion.startsWith('0.');

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
					Don&apos;t show this again
				</a>
			</h1>
			{isBeta && (
				<div className="mt-6 rounded p-2 pb-4 -m-2 bg-red-200 flex flex-col gap-y-2">
					<h2 className="text-xl font-medium text-red-800">
						This is a beta version
					</h2>
					<p>
						AMMiSTer is currently in beta. It's pretty solid, but there are
						probably bugs yet and more features and polish to come.
					</p>
					<p className="mt-2 mb-6">
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
					<h2 className="text-xl font-medium text-red-800">Alternative ROMs</h2>
					<p>
						AMMister does not support alternative ROMs. If you use those,
						don&apos;t export to your MiSTer. You can export to a directory to
						play with the app.
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
					Keep using update_all for all other types of updates. Don&apos;t
					worry, AMMiSTer will keep your arcade games updated just like
					update_all would have.
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
					Is your MiSTer not on a network? You can still use &quot;Export to
					Directory...&quot;, then copy that directory to a MiSTer.
				</p>
			</div>
		</div>
	);
}

export { Welcome };
export type { PublicWelcomeProps };
