import type { Dispatch, ReactNode } from 'react';
import React from 'react';
import { Dropdown } from 'react-bulma-components';
import type { IconName } from '..';
import { Badge, Icon } from '..';
import type {
  MultipleSelectorItem,
  MultipleSelectorState,
  MultipleSelectorStateAction,
} from './MultipleSelectorReducer';
import { MultipleSelectorStateActions } from './MultipleSelectorReducer';

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

  const label =
    iconLeft && children ? (
      <>
        <Icon icon={iconLeft} />
        <span>{children}</span>
      </>
    ) : iconLeft ? (
      <Icon icon={iconLeft} />
    ) : (
      children
    );

  return (
    <Dropdown
      label={label}
      right={left}
      up={up}
      icon={
        <>
          {state.selectedIds.length > 0 ? <Badge>{state.selectedIds.length}</Badge> : null}
          <Icon icon={up ? 'chevronUp' : 'chevronDown'} />
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
