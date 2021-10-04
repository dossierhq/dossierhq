import type { Dispatch, ReactNode } from 'react';
import React, { useState } from 'react';
import type {
  IconName,
  MultipleSelectorItem,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from '../index.js';
import { Badge, Button, DropdownDisplay, MultipleSelectorStateActions } from '../index.js';

export interface DropdownSelectorProps<TItem extends MultipleSelectorItem> {
  iconLeft?: IconName;
  left?: boolean;
  up?: boolean;
  renderItem: (item: TItem) => ReactNode;
  state: MultipleSelectorState<TItem>;
  dispatch: Dispatch<MultipleSelectorStateAction<TItem>>;
  children?: React.ReactNode;
}

interface DropdownSelectorItemProps<TItem extends MultipleSelectorItem> {
  item: TItem;
  state: MultipleSelectorState<TItem>;
  dispatch: Dispatch<MultipleSelectorStateAction<TItem>>;
  children: React.ReactNode;
}

export function DropdownSelector<TItem extends MultipleSelectorItem>({
  iconLeft,
  left,
  up,
  renderItem,
  state,
  dispatch,
  children,
}: DropdownSelectorProps<TItem>): JSX.Element {
  //TODO close on escape
  const [active, setActive] = useState(false);

  return (
    <DropdownDisplay
      active={active}
      up={up}
      left={left}
      trigger={
        <Button
          iconLeft={iconLeft}
          iconRight={up ? 'chevronUp' : 'chevronDown'}
          onClick={() => setActive((it) => !it)}
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

function Item<TItem extends MultipleSelectorItem>({
  item,
  state,
  dispatch,
  children,
}: DropdownSelectorItemProps<TItem>) {
  const active = state.selectedIds.includes(item.id);

  const handleChange = () => {
    dispatch(new MultipleSelectorStateActions.ToggleItem(item.id));
  };

  return (
    <DropdownDisplay.Item active={active} onClick={handleChange}>
      {children}
    </DropdownDisplay.Item>
  );
}
