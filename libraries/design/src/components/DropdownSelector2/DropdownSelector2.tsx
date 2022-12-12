'use client';

import { useOverlayPosition } from '@react-aria/overlays';
import type { Dispatch, ReactNode } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useKeyHandler } from '../../hooks/useKeyHandler.js';
import { useWindowClick } from '../../hooks/useWindowClick.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import type {
  MultipleSelectorItem,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '../DropdownSelector/MultipleSelectorReducer.js';
import { MultipleSelectorStateActions } from '../DropdownSelector/MultipleSelectorReducer.js';
import type { IconName } from '../Icon/Icon.js';
import { Portal } from '../Portal/Portal.js';

export interface DropdownSelector2Props<TItem extends MultipleSelectorItem> {
  iconLeft?: IconName;
  left?: boolean;
  up?: boolean;
  sneaky?: boolean;
  renderItem: (item: TItem) => ReactNode;
  state: MultipleSelectorState<TItem>;
  dispatch: Dispatch<MultipleSelectorStateAction<TItem>>;
  children?: React.ReactNode;
}

interface DropdownSelector2ItemProps<
  TItem extends MultipleSelectorItem<TId>,
  TId extends string = string
> {
  item: TItem;
  state: MultipleSelectorState<TItem>;
  dispatch: Dispatch<MultipleSelectorStateAction<TItem>>;
  children: React.ReactNode;
}

export function DropdownSelector2<TItem extends MultipleSelectorItem>({
  iconLeft,
  left,
  up,
  sneaky,
  renderItem,
  state,
  dispatch,
  children,
}: DropdownSelector2Props<TItem>) {
  const [active, setActive] = useState(false);
  const handleClose = useCallback(() => setActive(false), [setActive]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useWindowClick(triggerRef, handleClose, active);
  useKeyHandler(['Escape'], handleClose, active);

  const { overlayProps } = useOverlayPosition({
    overlayRef: dialogRef,
    targetRef: triggerRef,
    isOpen: active,
    placement: `${up ? 'top' : 'bottom'} ${left ? 'end' : 'start'}`,
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
      <Button
        ref={triggerRef}
        iconLeft={iconLeft}
        iconRight={sneaky ? undefined : up ? 'chevronUp' : 'chevronDown'}
        color={sneaky ? 'light' : undefined}
        disabled={state.items.length === 0}
        onMouseDown={(event) => {
          event.preventDefault();
          setActive((it) => !it);
        }}
      >
        {children}
        {state.selectedIds.length > 0 ? <Badge>{state.selectedIds.length}</Badge> : null}
      </Button>
      {active ? (
        <Portal>
          <dialog {...overlayProps} ref={dialogRef} className="dialog-reset">
            <div className="dropdown-content">
              {state.items.map((item) => {
                return (
                  <Item key={item.id} item={item} state={state} dispatch={dispatch}>
                    {renderItem(item)}
                  </Item>
                );
              })}
            </div>
          </dialog>
        </Portal>
      ) : null}
    </>
  );
}

function Item<TItem extends MultipleSelectorItem<TId>, TId extends string = string>({
  item,
  state,
  dispatch,
  children,
}: DropdownSelector2ItemProps<TItem, TId>) {
  const active = state.selectedIds.includes(item.id);

  if (item.removable === false) {
    return (
      <div className="dropdown-item">
        <p>{children}</p>
      </div>
    );
  }

  const handleChange = () => {
    dispatch(new MultipleSelectorStateActions.ToggleItem(item.id));
  };

  return (
    <a className={toClassName('dropdown-item', active && 'is-active')} onClick={handleChange}>
      {children}
    </a>
  );
}
