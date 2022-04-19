import { useKeyHandler } from '@jonasb/datadata-design';
import React, { useEffect } from 'react';

interface ModalProps {
  show: boolean;
  size?: 'large';
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ show, size, onClose, children }: ModalProps): JSX.Element | null {
  useEffect(() => {
    if (show && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [show]);

  useKeyHandler(['Escape'], onClose, show);

  if (!show) {
    return null;
  }

  const sizeClassName = size === 'large' ? 'dd-is-large' : '';

  return (
    <div className="dd-modal" role="dialog">
      <div className="dd-modal-background" onClick={onClose} />
      <div className={`dd-modal-content dd-has-background dd-is-rounded ${sizeClassName}`}>
        {children}
      </div>
    </div>
  );
}
