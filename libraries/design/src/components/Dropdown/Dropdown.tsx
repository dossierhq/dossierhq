import React, { useState } from 'react';
import type { IconName } from '../index.js';
import { Button, DropdownDisplay } from '../index.js';

export interface DropdownProps<TItem extends DropdownItem = DropdownItem> {
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
          disabled={disabled}
          onClick={() => setActive((it) => !it)}
        >
          {children}
        </Button>
      }
    >
      {items.map((item) => (
        <DropdownDisplay.Item key={item.id} onClick={() => onItemClick?.(item)}>
          {renderItem(item)}
        </DropdownDisplay.Item>
      ))}
    </DropdownDisplay>
  );
}
