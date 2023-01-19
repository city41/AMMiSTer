import React from 'react';
import clsx from 'clsx';
import { Modal, ModalProps } from '../Modal';
import { IconType } from 'src/renderer/icons';
import { Button } from '../Button';

type BaseFeedbackModalProps = ModalProps & {
	icon: IconType;
	title: string;
	errorOccured?: boolean;
	okButtonEnabled?: boolean;
	okButtonText?: string;
	onOkClick: () => void;
	onCancelClick?: () => void;
	canceling?: boolean;
	cancelButtonEnabled?: boolean;
};

function BaseFeedbackModal({
	icon,
	title,
	errorOccured,
	okButtonEnabled,
	okButtonText,
	onOkClick,
	onCancelClick,
	canceling,
	cancelButtonEnabled,
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
						<div
							className={clsx(
								'flex h-12 w-12 p-2 items-center justify-center rounded-full',
								{
									'bg-indigo-50': !errorOccured,
									'bg-red-300': errorOccured,
								}
							)}
						>
							<Icon
								className={clsx({
									'text-indigo-300': !errorOccured,
									'text-red-600': errorOccured,
								})}
							/>
						</div>
						<div className="mt-0 ml-4 flex flex-col gap-y-2">
							<h3 className="text-lg font-medium leading-6 text-gray-900">
								{title}
							</h3>
							{children}
						</div>
					</div>
				</div>
				<div className="bg-gray-50 px-6 py-3 flex flex-row-reverse gap-x-2">
					<Button disabled={!okButtonEnabled} onClick={onOkClick}>
						{okButtonText ?? 'Okay'}
					</Button>
					{!!onCancelClick && (
						<Button
							disabled={!cancelButtonEnabled || canceling}
							variant="danger"
							onClick={onCancelClick}
						>
							{canceling ? 'Canceling...' : 'Cancel'}
						</Button>
					)}
				</div>
			</div>
		</Modal>
	);
}

export { BaseFeedbackModal };
