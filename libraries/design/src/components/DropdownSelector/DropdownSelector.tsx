'use client';
import type { Dispatch, ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useKeyHandler } from '../../hooks/useKeyHandler.js';
import { useWindowClick } from '../../hooks/useWindowClick.js';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { DropdownDisplay } from '../DropdownDisplay/DropdownDisplay.js';
import type { IconName } from '../Icon/Icon.js';
import type {
  MultipleSelectorItem,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from './MultipleSelectorReducer.js';
import { MultipleSelectorStateActions } from './MultipleSelectorReducer.js';

export interface DropdownSelectorProps<TItem extends MultipleSelectorItem> {
  iconLeft?: IconName;
  left?: boolean;
  up?: boolean;
  sneaky?: boolean;
  renderItem: (item: TItem) => ReactNode;
  state: MultipleSelectorState<TItem>;
  dispatch: Dispatch<MultipleSelectorStateAction<TItem>>;
  children?: ReactNode;
}

interface DropdownSelectorItemProps<
  TItem extends MultipleSelectorItem<TId>,
  TId extends string = string,
> {
  item: TItem;
  state: MultipleSelectorState<TItem>;
  dispatch: Dispatch<MultipleSelectorStateAction<TItem>>;
  children: ReactNode;
}

export function DropdownSelector<TItem extends MultipleSelectorItem>({
  iconLeft,
  left,
  up,
  sneaky,
  renderItem,
  state,
  dispatch,
  children,
}: DropdownSelectorProps<TItem>): JSX.Element {
  const [active, setActive] = useState(false);
  const handleClose = useCallback(() => setActive(false), [setActive]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useWindowClick(triggerRef, handleClose, active);
  useKeyHandler(['Escape'], handleClose, active);

  return (
    <DropdownDisplay
      active={active}
      up={up}
      left={left}
      triggerRef={triggerRef}
      trigger={
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
      }
    >
      {state.items.map((item) => {
        return (
          <Item key={item.id} item={item} state={state} dispatch={dispatch}>
            {renderItem(item)}
          </Item>
        );
      })}
    </DropdownDisplay>
  );
}

function Item<TItem extends MultipleSelectorItem<TId>, TId extends string = string>({
  item,
  state,
  dispatch,
  children,
}: DropdownSelectorItemProps<TItem, TId>) {
  const active = state.selectedIds.includes(item.id);

  if (item.removable === false) {
    return <DropdownDisplay.ContentItem>{children}</DropdownDisplay.ContentItem>;
  }

  const handleChange = () => {
    dispatch(new MultipleSelectorStateActions.ToggleItem(item.id));
  };

  return (
    <DropdownDisplay.Item active={active} onClick={handleChange}>
      {children}
    </DropdownDisplay.Item>
  );
}
