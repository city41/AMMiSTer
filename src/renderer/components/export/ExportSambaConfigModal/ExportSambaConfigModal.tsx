import React, { useState } from 'react';
import clsx from 'clsx';
import { BaseFeedbackModal } from '../../BaseFeedbackModal';
import { MisterKunIcon } from '../../../icons';
import { SambaConfig } from '../../../../main/export/types';

type ExportSambaConfigModalProps = {
	isOpen: boolean;
	onRequestClose: () => void;
	onExport: (config: SambaConfig) => void;
};

function HelpButton({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
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
				<div className="absolute bg-gray-200 text-gray-800 text-left text-xs p-3 w-60 z-10">
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

function isConfigComplete(config: Partial<SambaConfig>): config is SambaConfig {
	const values = Object.values(config);

	return values.length === 5 && values.every((v) => v.trim().length > 0);
}

function ExportSambaConfigModal({
	isOpen,
	onRequestClose,
	onExport,
}: ExportSambaConfigModalProps) {
	const [sambaConfig, setSambaConfig] = useState<Partial<SambaConfig>>({
		share: 'sdcard',
	});

	return (
		<BaseFeedbackModal
			isOpen={isOpen}
			title="Export to MiSTer"
			okButtonText="Export"
			okButtonEnabled={isConfigComplete(sambaConfig)}
			icon={MisterKunIcon}
			onOkClick={() => onExport(sambaConfig as SambaConfig)}
			closeButton
			onRequestClose={onRequestClose}
		>
			<div className="flex flex-col items-stretch">
				<dl className="bg-white">
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">
							IP Address (or Host Name)
							<HelpButton>
								IP Address is best, especially if you have more than one MiSTer.
								It is displayed in the main menu on the MiSTer
							</HelpButton>
						</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<input
								type="text"
								className="w-full py-1 border-b-2 border-gray-300 bg-transparent"
								value={sambaConfig.host}
								onChange={(e) => {
									setSambaConfig((sc) => {
										return {
											...sc,
											host: e.target.value,
										};
									});
								}}
							/>
						</dd>
					</div>
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">
							Domain
							<HelpButton>
								Unless you have changed it, this will be "MiSTer"
							</HelpButton>
						</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<input
								type="text"
								className="w-full py-1 border-b-2 border-gray-300 bg-transparent"
								value={sambaConfig.domain}
								onChange={(e) => {
									setSambaConfig((sc) => {
										return {
											...sc,
											domain: e.target.value,
										};
									});
								}}
							/>
						</dd>
					</div>
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Share</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<select
								className="w-full py-1 border-b-2 border-gray-300 bg-transparent"
								value={sambaConfig.share}
								onChange={(e) => {
									setSambaConfig((sc) => {
										return {
											...sc,
											share: e.target.value,
										};
									});
								}}
							>
								<option value="sdcard">sdcard</option>
								<option value="usb0">usb0</option>
								<option value="usb1">usb1</option>
								<option value="usb2">usb2</option>
								<option value="usb3">usb3</option>
								<option value="usb4">usb4</option>
								<option value="usb5">usb5</option>
								<option value="usb6">usb6</option>
								<option value="usb7">usb7</option>
								<option value="tmp">tmp</option>
							</select>
						</dd>
					</div>
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">
							Username
							<HelpButton>
								Unless you have changed it, this will be "root"
							</HelpButton>
						</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<input
								type="text"
								className="w-full py-1 border-b-2 border-gray-300 bg-transparent"
								value={sambaConfig.username}
								onChange={(e) => {
									setSambaConfig((sc) => {
										return {
											...sc,
											username: e.target.value,
										};
									});
								}}
							/>
						</dd>
					</div>
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 mb-16">
						<dt className="text-sm font-medium text-gray-500">
							Password
							<HelpButton>
								Unless you have changed it, this will be "1"
							</HelpButton>
						</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<input
								type="text"
								className="w-full py-1 border-b-2 border-gray-300 bg-transparent"
								value={sambaConfig.password}
								onChange={(e) => {
									setSambaConfig((sc) => {
										return {
											...sc,
											password: e.target.value,
										};
									});
								}}
							/>
						</dd>
					</div>
				</dl>
			</div>
		</BaseFeedbackModal>
	);
}

export { ExportSambaConfigModal };
