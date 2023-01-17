import React, { useState } from 'react';
import { Modal, ModalProps } from '../../Modal';
import { Criteria as CriteriaCmp } from './Criteria';
import { Button } from '../../Button';
import { AddIcon } from '../../../icons';
import { BulkAddCriteria } from '../planSlice';

type PublicBulkAddModalProps = ModalProps & { className?: string };

type InternalBulkAddModalProps = {
	destination: string;
	onApply: (criteria: BulkAddCriteria[]) => void;
};

function BulkAddModal({
	className,
	destination,
	onApply,
	...rest
}: PublicBulkAddModalProps & InternalBulkAddModalProps) {
	const [criterias, setCriterias] = useState<BulkAddCriteria[]>([
		{
			gameAspect: 'gameName',
			operator: 'is',
			value: 'Street Fighter',
		},
	]);

	return (
		<Modal {...rest} closeButton>
			<div
				style={{
					width: '85vw',
					maxHeight: '80vh',
					maxWidth: 1300,
				}}
			>
				<div className="py-5 px-6">
					<h1 className="text-lg font-medium leading-6 text-gray-900">
						Bulk Add Games
					</h1>
					<p className="mt-2 text-sm text-gray-600">
						Add games to {destination || 'the main arcade directory'}
					</p>
				</div>
				<div className="flex flex-col items-stretch">
					<dl className="bg-white">
						<div className="even:bg-gray-50 px-6 py-5 grid grid-cols-7 gap-4">
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
							<dd className="mt-0 text-gray-900 col-span-6">
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
																const newCc = {
																	...cc,
																	[prop]: value,
																} as BulkAddCriteria;

																if (prop === 'gameAspect') {
																	// TODO: such a nasty hack...
																	if (value === 'rotation') {
																		newCc.value = 0;
																	} else {
																		newCc.value = '';
																	}
																}
																return newCc;
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
					</dl>
				</div>
				<div className="flex flex-row justify-end p-2">
					<Button
						onClick={() => {
							onApply(criterias);
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
