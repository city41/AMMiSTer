import clsx from 'clsx';
import React from 'react';
import Toggle from 'react-toggle';
import { Settings } from '../../../../main/settings/types';
import { Modal, ModalProps } from '../../Modal';

type PublicSettingsModalProps = ModalProps & { className?: string };

type InternalSettingsModalProps = {
	settings: Settings;
	onSettingsChange: (newSettings: Settings) => void;
};

export const EXPORT_OPTIMIZATION_WIKI_URL =
	'https://github.com/city41/AMMiSTer/wiki/Space-vs-Speed-Exporting-Optimizations';

function Rule() {
	return <div className="col-span-2 mx-4 border-b border-b-gray-300" />;
}

function SettingsModal({
	className,
	settings,
	onSettingsChange,
	...rest
}: PublicSettingsModalProps & InternalSettingsModalProps) {
	function handleExportOptimizationChange() {
		onSettingsChange({
			...settings,
			exportOptimization:
				settings.exportOptimization === 'space' ? 'speed' : 'space',
		});
	}

	const allNonDependentDbsEnabled = settings.updateDbs
		.filter((udb) => !udb.isDependent)
		.every((udb) => udb.enabled);

	return (
		<Modal {...rest} closeButton>
			<div
				className="bg-yellow-100"
				style={{
					width: '50vw',
					maxHeight: '80vh',
					maxWidth: 800,
				}}
			>
				<div className="py-5 px-6 border-b border-b-gray-400">
					<h1 className="text-lg font-medium leading-6 text-gray-900">
						Settings
					</h1>
				</div>
				<div className="bg-yellow-50 py-4">
					<dl className="flex flex-col gap-y-2">
						<div className="px-6 py-8 grid grid-cols-2 gap-x-4 gap-y-4 items-center">
							<dt className="text-sm font-medium text-gray-600 flex flex-row gap-x-2">
								<label htmlFor="downloadRoms">
									Download ROMs from archive.org
									<div
										className={clsx('text-xs text-red-600', {
											invisible: !settings.downloadRoms,
										})}
									>
										Warning: these files may be copyrighted
									</div>
								</label>
							</dt>
							<dd className="mt-0 text-gray-900 flex flex-row justify-end">
								<Toggle
									checked={!!settings.downloadRoms}
									id="downloadRoms"
									onChange={() => {
										onSettingsChange({
											...settings,
											downloadRoms: !settings.downloadRoms,
										});
									}}
								/>
							</dd>
						</div>
						<Rule />
						<div className="px-6 py-5 grid grid-cols-2 gap-4">
							<dt className="text-sm font-medium text-gray-600 flex flex-row gap-x-2">
								<label htmlFor="downloadRoms">Update Databases</label>
							</dt>
							<dd className="mt-0 text-gray-900">
								<ul className="flex flex-col gap-y-2">
									{settings.updateDbs
										.filter((udb) => !udb.isDependent)
										.map((db) => {
											return (
												<li
													key={db.db_id}
													className="grid"
													style={{ gridTemplateColumns: '1fr max-content' }}
												>
													<label
														htmlFor={db.db_id}
														className="text-sm cursor-pointer"
													>
														{db.displayName}
													</label>
													<Toggle
														checked={!!db.enabled}
														id={db.db_id}
														onChange={() => {
															onSettingsChange({
																...settings,
																updateDbs: settings.updateDbs.map((udb) => {
																	if (udb.db_id === db.db_id) {
																		return {
																			...udb,
																			enabled: !udb.enabled,
																		};
																	} else {
																		return udb;
																	}
																}),
															});
														}}
													/>
												</li>
											);
										})}
								</ul>
							</dd>
						</div>
						<Rule />
						<div className="px-6 py-5 grid grid-cols-2 gap-4">
							<dt className="text-sm font-medium text-gray-600 flex flex-row gap-x-2">
								<label htmlFor="downloadRoms">
									Extra Databases
									<div
										className={clsx('text-xs text-red-600', {
											invisible: allNonDependentDbsEnabled,
										})}
									>
										To use these databases, all main databases above must be
										enabled
									</div>
								</label>
							</dt>
							<dd className="mt-0 text-gray-900">
								<ul className="flex flex-col gap-y-2">
									{settings.updateDbs
										.filter((udb) => udb.isDependent)
										.map((db) => {
											return (
												<li
													key={db.db_id}
													className="grid"
													style={{ gridTemplateColumns: '1fr max-content' }}
												>
													<label
														htmlFor={db.db_id}
														className="text-sm cursor-pointer"
													>
														{db.displayName}
													</label>
													<Toggle
														checked={!!db.enabled && allNonDependentDbsEnabled}
														disabled={!allNonDependentDbsEnabled}
														id={db.db_id}
														onChange={() => {
															onSettingsChange({
																...settings,
																updateDbs: settings.updateDbs.map((udb) => {
																	if (udb.db_id === db.db_id) {
																		return {
																			...udb,
																			enabled: !udb.enabled,
																		};
																	} else {
																		return udb;
																	}
																}),
															});
														}}
													/>
												</li>
											);
										})}
								</ul>
							</dd>
						</div>
						<Rule />
						<div className="px-6 py-5 grid grid-cols-2 gap-4">
							<dt className="text-sm font-medium text-gray-600 flex flex-col gap-x-2">
								<div>Export Optimization</div>
								<div className="text-xs">
									<a
										href={EXPORT_OPTIMIZATION_WIKI_URL}
										className="text-blue-600 underline cursor-pointer"
										target="_blank"
										rel="noreferrer"
									>
										What is this?
									</a>
								</div>
							</dt>
							<dd className="mt-0 text-gray-900 grid grid-cols-2 gap-y-2 items-center">
								<div className="flex flex-row gap-x-2">
									<input
										type="radio"
										id="exportOptimization-space"
										name="exportOptimization"
										value="space"
										checked={settings.exportOptimization === 'space'}
										onChange={handleExportOptimizationChange}
									/>
									<label
										className="cursor-pointer"
										htmlFor="exportOptimization-space"
									>
										Space
									</label>
								</div>
								<div className="flex flex-row gap-x-2">
									<input
										type="radio"
										id="exportOptimization-speed"
										name="exportOptimization"
										value="speed"
										checked={settings.exportOptimization === 'speed'}
										onChange={handleExportOptimizationChange}
									/>
									<label
										className="cursor-pointer"
										htmlFor="exportOptimization-speed"
									>
										Speed
									</label>
								</div>
								<div
									className={clsx('col-span-2 text-xs text-red-600', {
										invisible: settings.exportOptimization === 'space',
									})}
								>
									Heads up: The first speed export will actually be slower.{' '}
									<a
										href={EXPORT_OPTIMIZATION_WIKI_URL}
										className="text-blue-600 underline cursor-pointer"
										target="_blank"
										rel="noreferrer"
									>
										Learn more.
									</a>
								</div>
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</Modal>
	);
}

export { SettingsModal };
export type { PublicSettingsModalProps };
