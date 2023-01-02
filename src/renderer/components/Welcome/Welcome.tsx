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
			<p className="mt-4 mb-4">
				Before you get started, make sure your MiSTer ...
			</p>
			<div className="rounded p-2 pb-4 -m-2 bg-white flex flex-col gap-y-2">
				<h2 className="text-lg font-medium">Has samba enabled</h2>
				<p>
					Samba is used to copy the games from your PC to the MiSTer. To enable
					it:
				</p>
				<ul className="list-disc ml-8 flex flex-col gap-y-2">
					<li>
						Rename <code>/media/fat/linux/_samba.sh</code> to{' '}
						<code>/media/fat/linux/samba.sh</code>
					</li>
					<li>
						In <code>/etc/samba/smb.conf</code>, add these lines under{' '}
						<code>[global]</code>
						<div className="flex flex-col ml-4">
							<code>min protocol = SMB2</code>
							<code>ntlm auth = yes</code>
						</div>
					</li>
				</ul>
				<p>
					The default username is <code>root</code>, password is <code>1</code>{' '}
					and domain is <code>MiSTer</code>. To change them, check the{' '}
					<a
						href="https://github.com/MiSTer-devel/Wiki_MiSTer/wiki/Samba"
						target="_blank"
						rel="noreferrer"
						className="text-blue-600 underline"
					>
						wiki
					</a>{' '}
					for more information.
				</p>
				<p>Don't forget to reboot the MiSTer after making these changes.</p>
			</div>
			<div className="mt-6 rounded p-2 pb-4 -m-2 bg-white flex flex-col gap-y-2">
				<h2 className="text-lg font-medium ">
					Has arcade updates disabled for update_all
				</h2>
				<p>
					update_all and AMMiSter update your arcade games from the same
					sources, and will conflict with each other. Keep using update_all for
					all other types of updates. Don't worry, AMMiSTer will keep your
					arcade games updated.
				</p>
			</div>
			<div className="mt-6">
				<p>
					Don't want to make these changes? You can still use "Export to
					Directory...", then copy that directory to a MiSTer.
				</p>
			</div>
		</div>
	);
}

export { Welcome };
export type { PublicWelcomeProps };
