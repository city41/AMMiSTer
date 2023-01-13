import React, { Ref, RefObject } from 'react';
import clsx from 'clsx';

type InputProps = Omit<JSX.IntrinsicElements['input'], 'ref'> & {
	className?: string;
	ref?: RefObject<HTMLInputElement> | Ref<HTMLInputElement> | null;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
	{ className, ...rest },
	ref
) {
	return (
		<input
			ref={ref}
			className={clsx(
				className,
				'py-1 border-b-2 border-gray-300 bg-transparent'
			)}
			{...rest}
		/>
	);
});

export { Input };
