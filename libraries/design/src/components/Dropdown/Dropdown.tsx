import React from 'react';
import { Dropdown as BulmaDropdown } from 'react-bulma-components';
import type { IconName } from '../index.js';
import { Icon } from '../index.js';

export interface DropdownProps<TItem extends DropdownItem = DropdownItem> {
  id?: string;
  iconLeft?: IconName;
  left?: boolean;
  up?: boolean;
  items: TItem[];
  disabled?: boolean;
  renderItem: (item: TItem) => React.ReactNode;
  onItemClick?: (item: TItem) => void;
  children?: React.ReactNode;
}

export interface DropdownItem {
  id: string;
}

export function Dropdown<TItem extends DropdownItem>({
  id,
  iconLeft,
  left,
  up,
  items,
  disabled,
  renderItem,
  onItemClick,
  children,
}: DropdownProps<TItem>): JSX.Element {
  //TODO close on escape
  const handleChange = onItemClick
    ? (value: string) => {
        const item = items.find((it) => it.id === value);
        if (item) onItemClick(item);
      }
    : undefined;

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
    <BulmaDropdown
      id={id}
      label={label}
      right={left}
      up={up}
      icon={<Icon icon={up ? 'chevronUp' : 'chevronDown'} />}
      disabled={disabled}
      onChange={handleChange}
    >
      {items.map((item) => (
        <BulmaDropdown.Item key={item.id} value={item.id} renderAs="a">
          {renderItem(item)}
        </BulmaDropdown.Item>
      ))}
    </BulmaDropdown>
  );
}
