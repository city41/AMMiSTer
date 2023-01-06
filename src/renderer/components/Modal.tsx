import React from 'react';
import ReactModal, { Props as ReactModalProps } from 'react-modal';
import { CloseIcon } from '../icons';

type ModalProps = ReactModalProps & {
	closeButton?: boolean;
};

function Modal({ children, closeButton, ...rest }: ModalProps) {
	return (
		// @ts-expect-error
		<ReactModal
			ariaHideApp={false}
			style={{
				content: {
					padding: 0,
					inset: null,
					position: null,
				},
				overlay: {
					backgroundColor: null,
				},
			}}
			{...rest}
		>
			<div className="relative">
				{closeButton && (
					<CloseIcon
						className="w-5 h-5 absolute top-2 right-2 cursor-pointer"
						onClick={rest.onRequestClose}
					/>
				)}
				{children}
			</div>
		</ReactModal>
	);
}

export { Modal };
export type { ModalProps };
