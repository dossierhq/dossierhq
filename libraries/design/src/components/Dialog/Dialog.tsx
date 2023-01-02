import type { ReactNode, SyntheticEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { toSizeClassName } from '../../utils/LayoutPropsUtils.js';
import { Portal } from '../Portal/Portal.js';

export interface DialogProps {
  show: boolean;
  form?: boolean;
  modal?: boolean;
  width?: keyof typeof widthClassNameMap;
  height?: keyof typeof heightClassNameMap;
  onClose: (event: SyntheticEvent<HTMLDialogElement>, returnValue: string) => void;
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
    (event: SyntheticEvent<HTMLDialogElement>) => {
      const dialog = dialogRef.current;
      onClose(event, dialog?.returnValue ?? '');
      // reset returnValue since if next time we show the dialog we don't want the old value (esc key doesn't set returnValue)
      if (dialog) dialog.returnValue = '';
    },
    [onClose]
  );

  useEffect(() => {
    if (!dialogRef.current) return;
    const dialog = dialogRef.current;

    // don't do anything if already in right state (due to useEffect double run)
    if (show === dialog.open) {
      return;
    }

    if (show && modal) {
      dialog.showModal();
    } else if (show) {
      dialog.show();
    } else if (!show) {
      dialog.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const containerClassName = toClassName(
    width === 'wide' && 'container',
    height === 'fill' && 'is-height-100'
  );

  return (
    <Portal>
      <dialog
        ref={dialogRef}
        className={toClassName(
          'dialog',
          widthClassNameMap[width ?? 'narrow'],
          height && heightClassNameMap[height]
        )}
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
    </Portal>
  );
}
