import React from 'react';
import clsx from 'clsx';
import { CloseIcon } from '../../../icons';
import { Input } from '../../Input';

type GameAspect =
	| 'gameName'
	| 'manufacturer'
	| 'categories'
	| 'series'
	| 'platform'
	| 'move_inputs'
	| 'special_controls'
	| 'rotation'
	| 'yearReleased'
	| 'num_buttons'
	| 'core';

type CriteriaProps = {
	className?: string;
	gameAspect: GameAspect;
	operator: 'is' | 'is-not' | 'lte' | 'gte';
	value: string;
	onDelete: () => void;
	onChange: (args: {
		prop: 'gameAspect' | 'operator' | 'value';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		value: any;
	}) => void;
};

function OperatorOptions({ gameAspect }: { gameAspect: GameAspect }) {
	switch (gameAspect) {
		case 'core':
		case 'gameName':
		case 'categories':
		case 'series':
		case 'platform':
		case 'move_inputs':
		case 'special_controls':
		case 'manufacturer': {
			return (
				<>
					<option value="is">matches</option>
					<option value="is-not">does not match</option>
				</>
			);
		}
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

function ValueInput({
	gameAspect,
	value,
	onChange,
}: {
	gameAspect: GameAspect;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onChange: React.ChangeEventHandler<any>;
}) {
	switch (gameAspect) {
		case 'core':
		case 'gameName':
		case 'categories':
		case 'series':
		case 'platform':
		case 'move_inputs':
		case 'special_controls':
		case 'yearReleased':
		case 'num_buttons':
		case 'manufacturer': {
			return (
				<Input className="px-2" type="text" value={value} onChange={onChange} />
			);
		}
		case 'rotation': {
			return (
				<select value={value} onChange={onChange}>
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
}: CriteriaProps) {
	return (
		<div
			className={clsx(className, 'grid gap-x-2 p-2')}
			style={{ gridTemplateColumns: 'min-content min-content 1fr max-content' }}
		>
			<select
				className="px-2 py-1"
				value={gameAspect}
				onChange={(e) => {
					onChange({ prop: 'gameAspect', value: e.target.value });
				}}
			>
				<option value="gameName">Title</option>
				<option value="manufacturer">Manufacturer</option>
				<option value="categories">Category</option>
				<option value="yearReleased">Year</option>
				<option value="rotation">Rotation</option>
				<option value="core">Core</option>
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
					onChange({ prop: 'operator', value: e.target.value });
				}}
			>
				<OperatorOptions gameAspect={gameAspect} />
			</select>
			<ValueInput
				gameAspect={gameAspect}
				value={value}
				onChange={(e) => {
					onChange({ prop: 'value', value: e.target.value });
				}}
			/>
			<CloseIcon className="w-5 h-5 cursor-pointer" onClick={onDelete} />
		</div>
	);
}

export { Criteria };
