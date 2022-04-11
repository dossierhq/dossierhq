import type { ReactNode, Ref } from 'react';
import React, { useCallback, useRef, useState } from 'react';
import { useKeyHandler } from '../../hooks/useKeyHandler.js';
import { useWindowClick } from '../../hooks/useWindowClick.js';
import { DropdownDisplay } from '../index.js';

export interface DropdownItem {
  id: string;
}

export interface DropdownProps<
  TTrigger extends HTMLElement,
  TItem extends DropdownItem = DropdownItem
> {
  items: TItem[];
  activeItemIds?: string[];
  left?: boolean;
  up?: boolean;
  renderItem: (item: TItem) => React.ReactNode;
  renderTrigger: (ref: Ref<TTrigger>, onOpenDropDown: () => void) => ReactNode;
  onItemClick?: (item: TItem) => void;
}

export function Dropdown<TTrigger extends HTMLElement, TItem extends DropdownItem>({
  activeItemIds,
  items,
  left,
  up,
  renderItem,
  renderTrigger,
  onItemClick,
}: DropdownProps<TTrigger, TItem>) {
  const [active, setActive] = useState(false);
  const handleOpen = useCallback(() => setActive(true), []);
  const handleClose = useCallback(() => setActive(false), []);
  const triggerRef = useRef<TTrigger>(null);
  useWindowClick(triggerRef, handleClose, active);
  useKeyHandler(['Escape'], handleClose, active);

  // eslint-disable-next-line testing-library/render-result-naming-convention
  const trigger = renderTrigger(triggerRef, handleOpen);

  return (
    <DropdownDisplay active={active} up={up} left={left} trigger={trigger}>
      {items.map((item) => (
        <DropdownDisplay.Item
          key={item.id}
          active={activeItemIds?.includes(item.id)}
          onClick={() => onItemClick?.(item)}
        >
          {renderItem(item)}
        </DropdownDisplay.Item>
      ))}
    </DropdownDisplay>
  );
}
