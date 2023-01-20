import React from 'react';
import clsx from 'clsx';
import { CloseIcon } from '../../../icons';
import { Catalog } from '../../../../main/catalog/types';
import memoize from 'lodash/memoize';

type GameAspect =
	| 'gameName'
	| 'region'
	| 'manufacturer'
	| 'categories'
	| 'series'
	| 'platform'
	| 'move_inputs'
	| 'special_controls'
	| 'rotation'
	| 'yearReleased'
	| 'num_buttons';

type CriteriaProps = {
	className?: string;
	catalog: Catalog;
	gameAspect: GameAspect;
	operator: 'is' | 'is-not' | 'lte' | 'gte';
	value: string;
	onDelete: () => void;
	onChange: (args: {
		gameAspect: GameAspect;
		operator: string;
		value: string;
	}) => void;
};

function OperatorOptions({ gameAspect }: { gameAspect: GameAspect }) {
	switch (gameAspect) {
		case 'gameName':
		case 'region':
		case 'categories':
		case 'series':
		case 'platform':
		case 'move_inputs':
		case 'special_controls':
		case 'manufacturer':
		case 'rotation': {
			return (
				<>
					<option value="is">is</option>
					<option value="is-not">is not</option>
				</>
			);
		}
		case 'yearReleased':
		case 'num_buttons': {
			return (
				<>
					<option value="is">is</option>
					<option value="is-not">is not</option>
					<option value="gte">&gt;=</option>
					<option value="lte">&lt;=</option>
				</>
			);
		}
	}
}

const getAllOptionValues = memoize(
	function (catalog: Catalog, gameAspect: GameAspect): string[] {
		const { updatedAt: ignored, ...restOfCatalog } = catalog;

		const entries = Object.values(restOfCatalog).flat(1);

		const rawValues = entries.flatMap((e) => {
			let v = e[gameAspect];

			if (v === null || v === undefined) {
				return [];
			}

			v = String(v);

			if (Array.isArray(v)) {
				return v;
			}

			return [v];
		});

		return Array.from(new Set(rawValues)).sort();
	},
	(catalog: Catalog, gameAspect: GameAspect) => {
		return `${catalog.updatedAt}-${gameAspect}`;
	}
);

function getFirstValueFor(catalog: Catalog, gameAspect: GameAspect): string {
	if (gameAspect === 'rotation') {
		return 'horizontal';
	}

	const values = getAllOptionValues(catalog, gameAspect);
	return values[0];
}

function ValueInput({
	className,
	gameAspect,
	value,
	onChange,
	catalog,
}: {
	className?: string;
	gameAspect: GameAspect;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onChange: React.ChangeEventHandler<any>;
	catalog: Catalog;
}) {
	switch (gameAspect) {
		case 'gameName':
		case 'region':
		case 'categories':
		case 'series':
		case 'platform':
		case 'move_inputs':
		case 'special_controls':
		case 'yearReleased':
		case 'num_buttons':
		case 'manufacturer': {
			return (
				<select className={className} value={value} onChange={onChange}>
					{getAllOptionValues(catalog, gameAspect).map((o) => {
						return (
							<option key={o} value={o}>
								{o}
							</option>
						);
					})}
				</select>
			);
		}
		case 'rotation': {
			return (
				<select className={className} value={value} onChange={onChange}>
					<option value="horizontal">Horizontal</option>
					<option value="vertical">Vertical</option>
				</select>
			);
		}
	}
}

function Criteria({
	className,
	gameAspect,
	operator,
	value,
	onDelete,
	onChange,
	catalog,
}: CriteriaProps) {
	return (
		<div
			className={clsx(
				className,
				'grid gap-x-3 px-2 py-1 first:-mt-1 items-center justify-center'
			)}
			style={{ gridTemplateColumns: '40% max-content 40% max-content' }}
		>
			<select
				className="px-2 py-1"
				value={gameAspect}
				onChange={(e) => {
					onChange({
						gameAspect: e.target.value as GameAspect,
						operator: 'is',
						value: getFirstValueFor(catalog, e.target.value as GameAspect),
					});
				}}
			>
				<option value="gameName">Title</option>
				<option value="manufacturer">Manufacturer</option>
				<option value="categories">Category</option>
				<option value="yearReleased">Year</option>
				<option value="region">Region</option>
				<option value="rotation">Rotation</option>
				<option value="series">Series</option>
				<option value="platform">Platform</option>
				<option value="move_inputs">Controls</option>
				<option value="special_controls">Special Controls</option>
				<option value="num_buttons">No. of Buttons</option>
			</select>
			<select
				className="px-2 py-1"
				value={operator}
				onChange={(e) => {
					onChange({ gameAspect, operator: e.target.value, value });
				}}
			>
				<OperatorOptions gameAspect={gameAspect} />
			</select>
			<ValueInput
				className="px-2 py-1"
				gameAspect={gameAspect}
				value={value}
				onChange={(e) => {
					onChange({ gameAspect, operator, value: e.target.value });
				}}
				catalog={catalog}
			/>
			<CloseIcon className="w-5 h-5 cursor-pointer" onClick={onDelete} />
		</div>
	);
}

export { Criteria };
