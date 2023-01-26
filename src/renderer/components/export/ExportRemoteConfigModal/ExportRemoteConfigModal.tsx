import React, { useState } from 'react';
import { BaseFeedbackModal } from '../../BaseFeedbackModal';
import { MisterKunIcon } from '../../../icons';
import { Input } from '../../Input';
import { FileClientConnectConfig } from '../../../../main/export/types';
import { HelpButton } from '../../HelpButton';

type ExportRemoteConfigModalProps = {
	isOpen: boolean;
	onRequestClose: () => void;
	onExport: (config: FileClientConnectConfig) => void;
};

function isConfigComplete(
	config: Partial<FileClientConnectConfig>
): config is FileClientConnectConfig {
	const values = Object.values(config);

	return values.length === 5 && values.every((v) => v.trim().length > 0);
}

const DEFAULT_CONFIG: FileClientConnectConfig = {
	host: '',
	port: '22',
	mount: 'sdcard',
	username: 'root',
	password: '1',
};

function ExportRemoteConfigModal({
	isOpen,
	onRequestClose,
	onExport,
}: ExportRemoteConfigModalProps) {
	const [sshConfig, setSSHConfig] =
		useState<FileClientConnectConfig>(DEFAULT_CONFIG);

	function handleClose() {
		setSSHConfig(DEFAULT_CONFIG);
		onRequestClose();
	}

	return (
		<BaseFeedbackModal
			isOpen={isOpen}
			title="Export to MiSTer"
			okButtonText="Export"
			okButtonEnabled={isConfigComplete(sshConfig)}
			icon={MisterKunIcon}
			onOkClick={() => onExport(sshConfig as FileClientConnectConfig)}
			closeButton
			cancelButtonEnabled
			onCancelClick={handleClose}
			onRequestClose={handleClose}
		>
			<div className="flex flex-col items-stretch">
				<dl className="bg-white">
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">
							IP Address
							<HelpButton>
								It is displayed on the main menu on the MiSTer
							</HelpButton>
						</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<Input
								type="text"
								className="w-full"
								value={sshConfig.host}
								onChange={(e) => {
									setSSHConfig((sc) => {
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
							Port
							<HelpButton>
								If you haven&apos;t changed this on your MiSTer, just use the
								default
							</HelpButton>
						</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<Input
								type="number"
								className="w-full"
								value={sshConfig.port}
								onChange={(e) => {
									setSSHConfig((sc) => {
										return {
											...sc,
											port: e.target.value,
										};
									});
								}}
							/>
						</dd>
					</div>
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">Mount</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<select
								className="w-full py-1 border-b-2 border-gray-300 bg-transparent"
								value={sshConfig.port}
								onChange={(e) => {
									setSSHConfig((sc) => {
										return {
											...sc,
											port: e.target.value,
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
							</select>
						</dd>
					</div>
					<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt className="text-sm font-medium text-gray-500">
							Username
							<HelpButton>
								If you haven&apos;t changed this on your MiSTer, just use the
								default
							</HelpButton>
						</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<Input
								type="text"
								className="w-full"
								value={sshConfig.username}
								onChange={(e) => {
									setSSHConfig((sc) => {
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
								If you haven&apos;t changed this on your MiSTer, just use the
								default
							</HelpButton>
						</dt>
						<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<Input
								type="text"
								className="w-full"
								value={sshConfig.password}
								onChange={(e) => {
									setSSHConfig((sc) => {
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

export { ExportRemoteConfigModal };
