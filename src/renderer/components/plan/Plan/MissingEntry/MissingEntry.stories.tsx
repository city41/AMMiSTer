import React from 'react';
import { Meta } from '@storybook/react';
import { MissingEntry } from './MissingEntry';

const meta: Meta = {
	title: 'MissingEntry',
	component: MissingEntry,
};

export default meta;

export const Basic = () => {
	return (
		<MissingEntry
			entry={{
				missing: true,
				db_id: 'distribution_mister',
				relFilePath: '_Arcade/Space Invaders.mra',
			}}
			onClick={() => {}}
		/>
	);
};

export const Ellipsis = () => {
	return (
		<div style={{ width: 250 }}>
			<MissingEntry
				entry={{
					missing: true,
					db_id: 'distribution_mister',
					relFilePath: '_Arcade/Space Invaders Foo Bar Buuuz Long NameHere.mra',
				}}
				onClick={() => {}}
			/>
		</div>
	);
};
