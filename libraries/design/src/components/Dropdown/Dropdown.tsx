import React from 'react';
import { Dropdown as BulmaDropdown } from 'react-bulma-components';
import { Icon } from '..';

export interface DropdownProps<TItem extends DropdownItem = DropdownItem> {
  text: string;
  items: TItem[];
  renderItem: (item: TItem) => React.ReactNode;
  onItemClick: (item: TItem) => void;
}

export interface DropdownItem {
  id: string;
}

export function Dropdown<TItem extends DropdownItem>({
  text,
  items,
  renderItem,
  onItemClick,
}: DropdownProps<TItem>): JSX.Element {
  const handleChange = onItemClick
    ? (value: string) => {
        const item = items.find((it) => it.id === value);
        if (item) onItemClick(item);
      }
    : undefined;
  return (
    <BulmaDropdown label={text} icon={<Icon icon="chevronDown" />} onChange={handleChange}>
      {items.map((item) => (
        <BulmaDropdown.Item key={item.id} value={item.id} renderAs="a">
          {renderItem(item)}
        </BulmaDropdown.Item>
      ))}
    </BulmaDropdown>
  );
}
