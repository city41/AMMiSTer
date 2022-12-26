import React from 'react';
import ReactModal from 'react-modal';

type InternalUpdateModalProps = {
	isOpen: boolean;
	message?: string;
};

function UpdateModal({ isOpen, message }: InternalUpdateModalProps) {
	return <ReactModal isOpen={isOpen}>{message}</ReactModal>;
}

export { UpdateModal };
