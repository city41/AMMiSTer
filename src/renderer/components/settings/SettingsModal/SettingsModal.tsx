import React, { useEffect, useState } from 'react';
import { Settings } from '../../../../main/settings/types';
import { Button } from '../../Button';
import { Modal, ModalProps } from '../../Modal';

type PublicSettingsModalProps = ModalProps & { className?: string };

type InternalSettingsModalProps = {
	settings: Settings;
	onOk: (newSettings: Settings) => void;
};

function SettingsModal({
	className,
	settings,
	onOk,
	...rest
}: PublicSettingsModalProps & InternalSettingsModalProps) {
	const [pendingSettings, setPendingSettings] = useState({ ...settings });

	useEffect(() => {
		setPendingSettings({ ...settings, ...pendingSettings });
	}, [settings]);

	return (
		<Modal {...rest} closeButton>
			<div
				className="bg-yellow-50"
				style={{
					width: '50vw',
					maxHeight: '80vh',
					maxWidth: 800,
				}}
			>
				<div className="py-5 px-6">
					<h1 className="text-lg font-medium leading-6 text-gray-900">
						Settings
					</h1>
				</div>
				<div>
					<dl>
						<div className="even:bg-yellow-100 px-6 py-5 grid grid-cols-2 gap-4">
							<dt className="text-sm font-medium text-gray-600 flex flex-row gap-x-2">
								<label htmlFor="downloadRoms">
									Download ROMs from archive.org
								</label>
							</dt>
							<dd className="mt-0 text-gray-900">
								<input
									id="downloadRoms"
									type="checkbox"
									checked={!!pendingSettings.downloadRoms}
									onChange={() => {
										setPendingSettings((ps) => {
											return {
												...ps,
												downloadRoms: !ps.downloadRoms,
											};
										});
									}}
								/>
							</dd>
						</div>
					</dl>
				</div>
				<div className="flex flex-row justify-end gap-x-2 p-2">
					<Button
						variant="danger"
						onClick={(e) => {
							setPendingSettings(settings);
							rest?.onRequestClose?.(e);
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={() => {
							onOk(pendingSettings);
						}}
					>
						Okay
					</Button>
				</div>
			</div>
		</Modal>
	);
}

export { SettingsModal };
export type { PublicSettingsModalProps };
