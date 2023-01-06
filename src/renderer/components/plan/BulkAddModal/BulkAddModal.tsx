import React, { useState } from 'react';
import clsx from 'clsx';
import { Modal, ModalProps } from '../../Modal';
import { Criteria as CriteriaCmp } from './Criteria';
import { Button } from '../../Button';
import { AddIcon } from '../../../icons';
import { Input } from '../../Input';
import { HelpButton } from '../../HelpButton';
import { BulkAddCriteria } from '../planSlice';

type PublicBulkAddModalProps = ModalProps & { className?: string };

type InternalBulkAddModalProps = {
	onApply: (args: { criteria: BulkAddCriteria[]; destination: string }) => void;
	onDestinationChange: (newDest: string) => void;
	destinationExists: boolean;
};

function BulkAddModal({
	className,
	onApply,
	onDestinationChange,
	destinationExists,
	...rest
}: PublicBulkAddModalProps & InternalBulkAddModalProps) {
	const [criterias, setCriterias] = useState<BulkAddCriteria[]>([
		{
			gameAspect: 'manufacturer',
			operator: 'is',
			value: 'Capcom',
		},
	]);
	const [destination, setDestination] = useState('');

	return (
		<Modal {...rest} closeButton>
			<div
				style={{
					width: '55vw',
					maxHeight: '80vh',
					maxWidth: 900,
				}}
			>
				<div className="py-5 px-6">
					<h1 className="text-lg font-medium leading-6 text-gray-900">
						Bulk Add Games
					</h1>
					<p className="mt-2 bg-yellow-50 p-2 text-sm text-yellow-700">
						This is a key feature of AMMiSTer and will get better. For now it is
						pretty basic.
					</p>
				</div>
				<div className="flex flex-col items-stretch">
					<dl className="bg-white">
						<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500 flex flex-row gap-x-2">
								<div>Criteria</div>
								<AddIcon
									className="w-5 h-5"
									onClick={() => {
										setCriterias((cs) => {
											return cs.concat({
												gameAspect: 'manufacturer',
												operator: 'is',
												value: '',
											});
										});
									}}
								/>
							</dt>
							<dd className="mt-1 text-gray-900 sm:col-span-2 sm:mt-0">
								<ul className="flex flex-col gap-y-2">
									{criterias.map((c, i) => (
										<li key={i} className="even:bg-white">
											<CriteriaCmp
												{...c}
												onDelete={() => {
													setCriterias((cs) => {
														return cs.filter((cc) => cc !== c);
													});
												}}
												onChange={({ prop, value }) => {
													setCriterias((cs) => {
														return cs.map((cc) => {
															if (cc === c) {
																return {
																	...cc,
																	[prop]: value,
																} as BulkAddCriteria;
															} else {
																return cc;
															}
														});
													});
												}}
											/>
										</li>
									))}
								</ul>
							</dd>
						</div>
						<div className="even:bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
							<dt className="text-sm font-medium text-gray-500">
								Destination
								<HelpButton>
									A path within your plan such as "Capcom/Horizontal Shooters".
									Want to add them to the top of the plan? Leave this blank.
								</HelpButton>
							</dt>
							<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
								<Input
									type="text"
									value={destination}
									onChange={(e) => {
										setDestination(e.target.value);
										onDestinationChange(e.target.value);
									}}
								/>
								{!destinationExists && (
									<div className="text-sm text-red-700">Not found in plan</div>
								)}
							</dd>
						</div>
					</dl>
				</div>
				<div className="flex flex-row justify-end p-2">
					<Button
						disabled={!destinationExists}
						onClick={() => {
							onApply({ criteria: criterias, destination });
						}}
					>
						Apply
					</Button>
				</div>
			</div>
		</Modal>
	);
}

export { BulkAddModal };
