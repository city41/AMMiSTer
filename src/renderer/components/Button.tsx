import React from 'react';
import clsx from 'clsx';

type ButtonProps = Omit<JSX.IntrinsicElements['button'], 'ref'> & {
	className?: string;
};

function Button({ className, ...rest }: ButtonProps) {
	return (
		<button
			className={clsx(
				className,
				'rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm shadow-sm bg-indigo-600 text-white'
			)}
			{...rest}
		/>
	);
}

export { Button };
