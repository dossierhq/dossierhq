import type { FunctionComponent, MouseEventHandler, ReactNode } from 'react';
import React, { useCallback, useEffect, useRef } from 'react';
import { toClassName } from '../../utils/ClassNameUtils';
import type { SizeProps } from '../../utils/LayoutPropsUtils';
import { toSizeClassName } from '../../utils/LayoutPropsUtils';
import type { IconName } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';

export interface DialogProps extends SizeProps {
  show: boolean;
  modal?: boolean;
  onClose: (event: Event, returnValue: string) => void;
  children: ReactNode;
}

interface DialogFrameProps {
  children: ReactNode;
}

interface DialogHeaderProps {
  children: ReactNode;
}

interface DialogHeaderTitleProps {
  children: ReactNode;
}

interface DialogHeaderIconProps {
  icon: IconName;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

interface DialogBodyProps {
  children: ReactNode;
}

interface DialogComponent extends FunctionComponent<DialogProps> {
  Frame: FunctionComponent<DialogFrameProps>;
  Header: FunctionComponent<DialogHeaderProps>;
  HeaderTitle: FunctionComponent<DialogHeaderTitleProps>;
  HeaderIcon: FunctionComponent<DialogHeaderIconProps>;
  Body: FunctionComponent<DialogBodyProps>;
}

export const Dialog: DialogComponent = ({
  show,
  modal,
  onClose,
  children,
  ...sizeProps
}: DialogProps) => {
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
      className={toClassName('dialog', toSizeClassName(sizeProps))}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onClose={handleClose}
    >
      <form method="dialog" className="is-height-100">
        {children}
      </form>
    </dialog>
  );
};

Dialog.Frame = ({ children }: DialogFrameProps) => {
  return <div className="dialog-frame">{children}</div>;
};
Dialog.Frame.displayName = 'Dialog.Frame';

Dialog.Header = ({ children }: DialogHeaderProps) => {
  return <div className="dialog-header">{children}</div>;
};
Dialog.Header.displayName = 'Dialog.Header';

Dialog.HeaderTitle = ({ children }: DialogHeaderTitleProps) => {
  return <div className="dialog-header-title">{children}</div>;
};
Dialog.HeaderTitle.displayName = 'Dialog.HeaderTitle';

Dialog.HeaderIcon = ({ icon, onClick }: DialogHeaderIconProps) => {
  return (
    <IconButton
      className="is-height-100 is-aspect-1"
      color="white"
      icon={icon}
      size="medium"
      onClick={onClick}
    />
  );
};
Dialog.HeaderIcon.displayName = 'Dialog.HeaderIcon';

Dialog.Body = ({ children }: DialogBodyProps) => {
  return <div className="dialog-body">{children}</div>;
};
Dialog.Body.displayName = 'Dialog.Body';
