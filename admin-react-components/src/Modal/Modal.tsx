import React from 'react';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ show, onClose, children }: ModalProps): JSX.Element | null {
  if (!show) {
    return null;
  }

  return (
    <div className="dd modal">
      <div className="dd modal-background" onClick={onClose} />
      <div className="dd modal-content has-background">{children}</div>
    </div>
  );
}
