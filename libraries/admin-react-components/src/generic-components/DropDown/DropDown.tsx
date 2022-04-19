import { useKeyHandler } from '@jonasb/datadata-design';
import React, { useCallback, useState } from 'react';
import { Button, Icon, IconButton } from '../..';
import { useLegacyWindowClick } from '../../utils/MouseUtils';

export interface DropDownProps<TItem extends DropDownItem = DropDownItem> {
  id: string;
  className?: string;
  text: string;
  showAsIcon?: boolean;
  items: TItem[];
  onItemClick: (item: TItem) => void;
}

export interface DropDownItem {
  text: string;
  key: string;
}

export function DropDown<TItem extends DropDownItem>({
  id,
  className,
  text,
  showAsIcon,
  items,
  onItemClick,
}: DropDownProps<TItem>): JSX.Element {
  const [isActive, setActive] = useState(false);
  const handleClose = useCallback(() => setActive(false), [setActive]);
  useKeyHandler(['Escape'], handleClose, isActive);
  useLegacyWindowClick(id, handleClose, isActive);

  return (
    <div className={className}>
      {!showAsIcon ? (
        <Button id={id} onClick={() => setActive(!isActive)}>
          {text} <Icon icon="chevron-down" />
        </Button>
      ) : (
        <IconButton id={id} icon="chevron-down" title={text} onClick={() => setActive(!isActive)} />
      )}
      {isActive ? (
        <ul className="dd-dropdown-menu dd-is-rounded dd-has-background dd-has-shadow dd-list-container">
          {items.map((item) => (
            <li
              key={item.key}
              className="dd-button dd-text-button dd-hoverable"
              onClick={() => {
                onItemClick(item);
                setActive(false);
              }}
            >
              {item.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
