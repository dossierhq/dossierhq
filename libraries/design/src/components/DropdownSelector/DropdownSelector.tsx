import type { Dispatch, ReactNode } from 'react';
import React from 'react';
import { Dropdown } from 'react-bulma-components';
import { Badge, Icon } from '..';
import type {
  MultipleSelectorItem,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from './MultipleSelectorReducer';
import { MultipleSelectorStateActions } from './MultipleSelectorReducer';

export interface DropdownSelectorProps<TItem extends MultipleSelectorItem> {
  label: string;
  renderItem: (item: TItem) => ReactNode;
  state: MultipleSelectorState<TItem>;
  dispatch: Dispatch<MultipleSelectorStateAction<TItem>>;
}

interface DropdownSelectorItemProps<TItem extends MultipleSelectorItem> {
  item: TItem;
  state: MultipleSelectorState<TItem>;
  dispatch: Dispatch<MultipleSelectorStateAction<TItem>>;
  children: React.ReactNode;
}

export function DropdownSelector<TItem extends MultipleSelectorItem>({
  label,
  renderItem,
  state,
  dispatch,
}: DropdownSelectorProps<TItem>): JSX.Element {
  //TODO close on escape
  return (
    <Dropdown
      label={label}
      icon={
        <>
          {state.selectedIds.length > 0 ? <Badge>{state.selectedIds.length}</Badge> : null}
          <Icon icon="chevronDown" />
        </>
      }
    >
      {state.items.map((item) => {
        return (
          <Item key={item.id} item={item} state={state} dispatch={dispatch}>
            {renderItem(item)}
          </Item>
        );
      })}
    </Dropdown>
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
    // @ts-expect-error active is missing from the type
    <Dropdown.Item active={active} onClick={handleChange} value={undefined} renderAs="a">
      {children}
    </Dropdown.Item>
  );
}
