import { useOverlayPosition } from '@react-aria/overlays';
import type { FunctionComponent, MouseEventHandler, ReactNode, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { Portal } from '../Portal/Portal.js';

export interface DropdownDisplayProps {
  active?: boolean;
  up?: boolean;
  left?: boolean;
  trigger: ReactNode;
  triggerRef: RefObject<HTMLElement>;
  children: ReactNode;
}

export interface DropdownDisplayItemProps {
  active?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
}

export interface DropdownDisplayContentItemProps {
  children: ReactNode;
}

interface DropdownDisplayComponent extends FunctionComponent<DropdownDisplayProps> {
  Item: FunctionComponent<DropdownDisplayItemProps>;
  ContentItem: FunctionComponent<DropdownDisplayContentItemProps>;
}

export const DropdownDisplay: DropdownDisplayComponent = ({
  active,
  up,
  left,
  trigger,
  triggerRef,
  children,
}: DropdownDisplayProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const placement = `${up ? 'top' : 'bottom'} ${left ? 'end' : 'start'}` as const;
  const { overlayProps } = useOverlayPosition({
    overlayRef: dialogRef,
    targetRef: triggerRef,
    isOpen: active,
    placement,
  });

  useEffect(() => {
    if (!dialogRef.current) return;
    const dialog = dialogRef.current;

    // don't do anything if already in right state (due to useEffect double run)
    if (active === dialog.open) {
      return;
    }

    if (active) {
      dialog.show();
    } else if (!active) {
      dialog.close();
    }
  }, [active]);

  return (
    <>
      {trigger}
      {active ? (
        <Portal>
          <dialog {...overlayProps} ref={dialogRef} className="dialog-reset">
            <div className="dropdown-content">{children}</div>
          </dialog>
        </Portal>
      ) : null}
    </>
  );
};
DropdownDisplay.displayName = 'DropdownDisplay';

DropdownDisplay.Item = ({ active, onClick, children }: DropdownDisplayItemProps) => {
  return (
    <a className={toClassName('dropdown-item', active && 'is-active')} onClick={onClick}>
      {children}
    </a>
  );
};
DropdownDisplay.Item.displayName = 'DropdownDisplay.Item';

DropdownDisplay.ContentItem = ({ children }: DropdownDisplayContentItemProps) => {
  return (
    <div className="dropdown-item">
      <p>{children}</p>
    </div>
  );
};
DropdownDisplay.ContentItem.displayName = 'DropdownDisplay.ContentItem';
