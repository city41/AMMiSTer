import React from 'react';
import clsx from 'clsx';

type InternalWelcomeProps = {
	appVersion: string;
	onDismiss: () => void;
};

type PublicWelcomeProps = {
	className?: string;
};

const GETTING_STARTED_URL =
	'https://github.com/city41/AMMiSTer/wiki/Getting-Started#build-a-catalog';

const FAQ_URL = 'https://github.com/city41/AMMiSTer/wiki/FAQ';

function Welcome({
	className,
	appVersion,
	onDismiss,
}: InternalWelcomeProps & PublicWelcomeProps) {
	const isBeta = appVersion.startsWith('0.');

	return (
		<div
			className={clsx(className, 'rounded p-4 bg-yellow-100 text-sm shadow-lg')}
			style={{ maxWidth: 700, minWidth: 400 }}
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
			<div className="mt-6 rounded p-2 pb-4 -m-2 bg-white flex flex-col gap-y-4">
				<div>
					This is a new app for organizing arcade games on a MiSTer. Check out
					the{' '}
					<a
						className="text-blue-600 underline"
						href={GETTING_STARTED_URL}
						target="_blank"
						rel="noreferrer"
					>
						getting started guide
					</a>
					.
				</div>
				<div>
					<span className="text-red-700 font-bold">Warning:</span> this app
					conflicts with other ways of updating a MiSTer, check the{' '}
					<a
						className="text-blue-600 underline"
						href={FAQ_URL}
						target="_blank"
						rel="noreferrer"
					>
						FAQ
					</a>{' '}
					to learn more.
				</div>
			</div>
		</div>
	);
}

export { Welcome };
export type { PublicWelcomeProps };
