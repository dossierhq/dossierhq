import React, { useEffect } from 'react';
import { useKeyHandler } from '../../utils/KeyboardUtils';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ show, onClose, children }: ModalProps): JSX.Element | null {
  useEffect(() => {
    if (show && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [show]);

  useKeyHandler(['Escape'], onClose, show);

  if (!show) {
    return null;
  }

  return (
    <div className="dd modal" role="dialog">
      <div className="dd modal-background" onClick={onClose} />
      <div className="dd modal-content has-background is-rounded">{children}</div>
    </div>
  );
}
