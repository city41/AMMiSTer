import React from 'react';
import clsx from 'clsx';
import { CloseIcon } from '../../../icons';
import { Input } from '../../Input';

type CriteriaProps = {
	className?: string;
	gameAspect: 'manufacturer' | 'orientation' | 'yearReleased';
	operator: 'is' | 'is-not' | 'lte' | 'gte';
	value: string;
	onDelete: () => void;
	onChange: (args: {
		prop: 'gameAspect' | 'operator' | 'value';
		value: string;
	}) => void;
};

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
			style={{ gridTemplateColumns: 'repeat(3, 1fr) max-content' }}
		>
			<select
				className="px-2 py-1"
				value={gameAspect}
				onChange={(e) => {
					onChange({ prop: 'gameAspect', value: e.target.value });
				}}
			>
				<option value="manufacturer">Manufacturer</option>
				<option value="orientation">Orientation</option>
				<option value="yearReleased">Year</option>
			</select>
			<select
				className="px-2 py-1"
				value={operator}
				onChange={(e) => {
					onChange({ prop: 'operator', value: e.target.value });
				}}
			>
				<option value="is">is</option>
				<option value="is-not">is not</option>
				<option value="gte">&gt;=</option>
				<option value="lte">&lt;=</option>
			</select>
			<Input
				type="text"
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
