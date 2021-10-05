import React, { useCallback, useRef, useState } from 'react';
import { useKeyHandler } from '../../hooks/useKeyHandler.js';
import { useWindowClick } from '../../hooks/useWindowClick.js';
import type { IconName } from '../index.js';
import { Button, DropdownDisplay } from '../index.js';

export interface DropdownProps<TItem extends DropdownItem = DropdownItem> {
  iconLeft?: IconName;
  left?: boolean;
  up?: boolean;
  items: TItem[];
  disabled?: boolean;
  sneaky?: boolean;
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
  sneaky,
  disabled,
  renderItem,
  onItemClick,
  children,
}: DropdownProps<TItem>): JSX.Element {
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
      trigger={
        <Button
          ref={triggerRef}
          iconLeft={iconLeft}
          iconRight={sneaky ? undefined : up ? 'chevronUp' : 'chevronDown'}
          light={sneaky}
          disabled={disabled}
          onClick={(event) => {
            event.preventDefault();
            setActive((it) => !it);
          }}
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
