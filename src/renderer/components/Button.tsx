import React from 'react';
import clsx from 'clsx';

type ButtonProps = Omit<JSX.IntrinsicElements['button'], 'ref'> & {
	className?: string;
	variant?: 'danger';
};

function Button({ className, variant, ...rest }: ButtonProps) {
	return (
		<button
			className={clsx(
				className,
				'rounded-md px-4 py-2 font-medium text-sm shadow-sm',
				{
					'bg-indigo-600 text-white': !rest.disabled && variant !== 'danger',
					'bg-gray-300 text-gray-400': !!rest.disabled && variant !== 'danger',
					'bg-red-500 text-white': !rest.disabled && variant === 'danger',
					'bg-red-400 text-red-300': !!rest.disabled && variant === 'danger',
				}
			)}
			{...rest}
		/>
	);
}

export { Button };
