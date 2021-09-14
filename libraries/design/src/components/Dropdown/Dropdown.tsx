import React from 'react';
import { Dropdown as BulmaDropdown } from 'react-bulma-components';
import { Icon, IconName } from '..';

export interface DropdownProps<TItem extends DropdownItem = DropdownItem> {
  iconLeft?: IconName;
  items: TItem[];
  renderItem: (item: TItem) => React.ReactNode;
  onItemClick?: (item: TItem) => void;
  children?: React.ReactNode;
}

export interface DropdownItem {
  id: string;
}

export function Dropdown<TItem extends DropdownItem>({
  iconLeft,
  items,
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
    <BulmaDropdown label={label} icon={<Icon icon="chevronDown" />} onChange={handleChange}>
      {items.map((item) => (
        <BulmaDropdown.Item key={item.id} value={item.id} renderAs="a">
          {renderItem(item)}
        </BulmaDropdown.Item>
      ))}
    </BulmaDropdown>
  );
}
