import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import {
	Catalog,
	CatalogEntry as CatalogEntryType,
} from '../../../../main/catalog/types';
import { Modal, ModalProps } from '../../Modal';
import { Criteria as CriteriaCmp } from './Criteria';
import { Button } from '../../Button';
import { AddIcon, ArrowLeftIcon } from '../../../icons';
import { BulkAddCriteria } from '../planSlice';
import { CatalogEntry } from '../../catalog/CatalogEntry';

type PublicBulkAddModalProps = ModalProps & { className?: string };

type InternalBulkAddModalProps = {
	catalog: Catalog;
	destination: string;
	criteriaMatch: CatalogEntryType[] | null;
	onCriteriaChange: (criteria: BulkAddCriteria[]) => void;
	onApply: (criteria: BulkAddCriteria[]) => void;
	onCancel: () => void;
};

function BulkAddModal({
	className,
	destination,
	catalog,
	criteriaMatch,
	onCriteriaChange,
	onApply,
	onCancel,
	...rest
}: PublicBulkAddModalProps & InternalBulkAddModalProps) {
	const firstManufacturer = useMemo(() => {
		const { updatedAt, ...restOfCatalog } = catalog;
		const entries = Object.values(restOfCatalog).flat(1);
		const manufacturers = entries.flatMap((e) => e.manufacturer).sort();

		return manufacturers[0];
	}, [catalog]);

	const [criterias, _setCriterias] = useState<BulkAddCriteria[]>([]);

	function setCriterias(
		cb: (oldCriteria: BulkAddCriteria[]) => BulkAddCriteria[]
	) {
		const newCriterias = cb(criterias);
		onCriteriaChange(newCriterias);
		_setCriterias(newCriterias);
	}

	return (
		<Modal {...rest} closeButton>
			<div
				className="grid"
				style={{
					width: '85vw',
					maxHeight: '80vh',
					maxWidth: 1300,
					gridTemplateRows: 'max-content max-content 1fr max-content',
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
				<div
					className={clsx({
						'border-b border-gray-300': !!criteriaMatch,
					})}
				>
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
												value: firstManufacturer,
											});
										});
									}}
								/>
							</dt>
							<dd className="mt-0 text-gray-900 col-span-6">
								{criterias.length === 0 && (
									<div className="flex flex-row gap-x-2 items-center">
										<ArrowLeftIcon className="w-5 h-5" />
										<div>Click the plus to get started</div>
									</div>
								)}
								<ul className="flex flex-col gap-y-2">
									{criterias.map((c, i) => (
										<li key={i} className="even:bg-white">
											<CriteriaCmp
												{...c}
												catalog={catalog}
												onDelete={() => {
													setCriterias((cs) => {
														return cs.filter((cc) => cc !== c);
													});
												}}
												onChange={(incomingCC) => {
													setCriterias((cs) => {
														return cs.map((cc) => {
															if (cc === c) {
																return incomingCC as BulkAddCriteria;
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
				<div
					className={clsx('h-full px-4 py-4 overflow-y-auto bg-gray-100', {
						hidden: !criteriaMatch,
					})}
				>
					{criteriaMatch?.length === 0 && (
						<div className="grid place-items-center italic text-gray-500">
							No games matched
						</div>
					)}
					{!!criteriaMatch?.length && (
						<>
							<div className="mb-4 grid place-items-center italic text-gray-500">
								{criteriaMatch.length} game
								{criteriaMatch.length === 1 ? '' : 's'} matched
							</div>
							<div className="flex flex-row flex-wrap gap-x-3 gap-y-3 justify-center">
								{criteriaMatch.map((cm, i) => {
									return (
										<CatalogEntry
											key={`${i}-${cm.files.mra.fileName}`}
											className="bg-white border border-gray-200 p-1 shadow-lg"
											entry={cm}
											hideIcons
										/>
									);
								})}
							</div>
						</>
					)}
				</div>
				<div
					className={clsx('flex flex-row justify-end gap-x-2 p-2', {
						'border-t border-gray-300': !!criteriaMatch,
					})}
				>
					<Button variant="danger" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						onClick={() => {
							onApply(criterias);
						}}
						disabled={!criteriaMatch?.length}
					>
						{criteriaMatch?.length
							? `Add ${criteriaMatch.length} game${
									criteriaMatch.length === 1 ? '' : 's'
							  }`
							: 'Add Games'}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

export { BulkAddModal };
