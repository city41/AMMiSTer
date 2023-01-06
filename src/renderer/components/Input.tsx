import React from 'react';
import clsx from 'clsx';

type ButtonProps = Omit<JSX.IntrinsicElements['input'], 'ref'> & {
	className?: string;
};

function Input({ className, ...rest }: ButtonProps) {
	return (
		<input
			className={clsx(
				className,
				'w-full py-1 border-b-2 border-gray-300 bg-transparent'
			)}
			{...rest}
		/>
	);
}

export { Input };
