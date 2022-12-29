import React from 'react';
import ReactModal, { Props as ReactModalProps } from 'react-modal';

type ModalProps = ReactModalProps;

function Modal({ children, ...rest }: ModalProps) {
	return (
		// @ts-expect-error
		<ReactModal
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
			{children}
		</ReactModal>
	);
}

export { Modal };
