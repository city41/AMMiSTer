import React from 'react';
import clsx from 'clsx';
import { Modal, ModalProps } from '../Modal';
import { IconType } from 'src/renderer/icons';

type BaseFeedbackModalProps = ModalProps & {
	icon: IconType;
	title: string;
	okButtonEnabled?: boolean;
	okButtonText?: string;
	onOkClick: () => void;
};

function BaseFeedbackModal({
	icon,
	title,
	okButtonEnabled,
	okButtonText,
	onOkClick,
	children,
	className,
	...rest
}: BaseFeedbackModalProps) {
	const Icon = icon;

	return (
		<Modal {...rest}>
			<div
				className={clsx(className, 'rounded-lg bg-white grid')}
				style={{
					width: '55vw',
					maxHeight: '80vh',
					maxWidth: 900,
					gridTemplateRows: '1fr max-content',
				}}
			>
				<div className="bg-white p-6 pb-4 overflow-auto">
					<div
						className="grid gap-x-2"
						style={{ gridTemplateColumns: 'max-content 1fr' }}
					>
						<div className="flex h-12 w-12 p-2 items-center justify-center rounded-full bg-indigo-50">
							<Icon className="text-indigo-300" />
						</div>
						<div className="mt-0 ml-4 flex flex-col gap-y-2">
							<h3 className="text-lg font-medium leading-6 text-gray-900">
								{title}
							</h3>
							{children}
						</div>
					</div>
				</div>
				<div className="bg-gray-50 px-6 py-3 flex flex-row-reverse">
					<button
						type="button"
						disabled={!okButtonEnabled}
						onClick={onOkClick}
						className={clsx(
							'rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm shadow-sm',
							{
								'bg-indigo-600 text-white': okButtonEnabled,
								'bg-gray-300 text-gray-400': !okButtonEnabled,
							}
						)}
					>
						{okButtonText ?? 'Okay'}
					</button>
				</div>
			</div>
		</Modal>
	);
}

export { BaseFeedbackModal };
