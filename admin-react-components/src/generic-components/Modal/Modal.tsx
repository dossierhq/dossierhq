import React, { useEffect } from 'react';
import { useKeyHandler } from '../../utils/KeyboardUtils';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ show, onClose, children }: ModalProps): JSX.Element | null {
  if (!show) {
    return null;
  }

  useEffect(() => {
    if (show && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [show]);

  useKeyHandler(['Escape'], onClose);

  return (
    <div className="dd modal" role="dialog">
      <div className="dd modal-background" onClick={onClose} />
      <div className="dd modal-content has-background">{children}</div>
    </div>
  );
}
