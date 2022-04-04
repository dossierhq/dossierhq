import type { FunctionComponent, ReactNode } from 'react';
import { useCallback, useRef } from 'react';
import React, { useEffect } from 'react';
import { toClassName } from '../../utils/ClassNameUtils';
import type { TextStyle } from '../../utils/TextStylePropsUtils';
import { toTextStyleClassName } from '../../utils/TextStylePropsUtils';

export interface DialogProps {
  show: boolean;
  modal?: boolean;
  onClose: (event: Event, returnValue: string) => void;
  children: ReactNode;
}

interface DialogLeftProps {
  children: ReactNode;
}

interface DialogRightProps {
  children: ReactNode;
}

interface DialogItemProps {
  textStyle?: TextStyle;
  children: ReactNode;
}

interface DialogComponent extends FunctionComponent<DialogProps> {
  Left: FunctionComponent<DialogLeftProps>;
  Right: FunctionComponent<DialogRightProps>;
  Item: FunctionComponent<DialogItemProps>;
}

export const Dialog: DialogComponent = ({ show, modal, onClose, children }: DialogProps) => {
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
};
Dialog.displayName = 'Dialog';

Dialog.Left = ({ children }: DialogLeftProps) => {
  return <div className="Dialog-left">{children}</div>;
};
Dialog.Left.displayName = 'Dialog.Left';

Dialog.Right = ({ children }: DialogRightProps) => {
  return <div className="Dialog-right">{children}</div>;
};
Dialog.Right.displayName = 'Dialog.Right';

Dialog.Item = ({ textStyle, children }: DialogItemProps) => {
  return (
    <div className={toClassName('Dialog-item', textStyle && toTextStyleClassName(textStyle))}>
      {children}
    </div>
  );
};
Dialog.Item.displayName = 'Dialog.Item';
