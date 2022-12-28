import React from 'react';
import ReactModal, { Props as ReactModalProps } from 'react-modal';

type ModalProps = ReactModalProps;

function Modal({ children, ...rest }: ModalProps) {
	return (
		<ReactModal style={{ content: { padding: 0 } }} {...rest}>
			<div className="bg-slate-700 h-full">{children}</div>
		</ReactModal>
	);
}

export { Modal };
