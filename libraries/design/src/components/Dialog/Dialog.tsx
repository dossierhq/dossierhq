import type { ReactNode } from 'react';
import React, { useCallback, useEffect, useRef } from 'react';

export interface DialogProps {
  show: boolean;
  modal?: boolean;
  onClose: (event: Event, returnValue: string) => void;
  children: ReactNode;
}

export function Dialog({ show, modal, onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handleClose = useCallback(
    (event: Event) => {
      //TODO the bundled types for <dialog> are out of date
      const dialog = dialogRef.current as null | (HTMLDialogElement & { returnValue: string });
      onClose(event, dialog?.returnValue ?? '');
      // reset returnValue since if next time we show the dialog we don't want the old value (esc key doesn't set returnValue)
      if (dialog) dialog.returnValue = '';
    },
    [onClose]
  );

  useEffect(() => {
    if (!dialogRef.current) return;
    //TODO the bundled types for <dialog> are out of date
    const dialog = dialogRef.current as HTMLDialogElement & {
      showModal(): void;
      show(): void;
      close(): void;
    };
    if (show && modal) {
      dialog.showModal();
    } else if (show) {
      dialog.show();
    } else if (!show) {
      dialog.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog is-max-width-40rem is-width-100"
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onClose={handleClose}
    >
      <form method="dialog">{children}</form>
    </dialog>
  );
}
