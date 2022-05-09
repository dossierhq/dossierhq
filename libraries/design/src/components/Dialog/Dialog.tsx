import type { ReactNode } from 'react';
import React, { useCallback, useEffect, useRef } from 'react';
import { toClassName } from '../../utils/ClassNameUtils';
import { toSizeClassName } from '../../utils/LayoutPropsUtils';

export interface DialogProps {
  show: boolean;
  form?: boolean;
  modal?: boolean;
  width?: keyof typeof widthClassNameMap;
  height?: keyof typeof heightClassNameMap;
  onClose: (event: Event, returnValue: string) => void;
  children: ReactNode;
}

const widthClassNameMap = {
  narrow: toSizeClassName({ width: '100%', maxWidth: '40rem' }),
  wide: toSizeClassName({ width: '100%' }),
};

const heightClassNameMap = {
  fill: toSizeClassName({ height: '100vh' }),
};

export function Dialog({ show, form, width, height, modal, onClose, children }: DialogProps) {
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

  const containerClassName = `${width === 'wide' ? 'container ' : ''}is-height-100`;

  return (
    <dialog
      ref={dialogRef}
      className={toClassName(
        'dialog',
        widthClassNameMap[width ?? 'narrow'],
        height && heightClassNameMap[height]
      )}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onClose={handleClose}
    >
      {form ? (
        <form method="dialog" className={containerClassName}>
          {children}
        </form>
      ) : (
        <div className={containerClassName}>{children}</div>
      )}
    </dialog>
  );
}
