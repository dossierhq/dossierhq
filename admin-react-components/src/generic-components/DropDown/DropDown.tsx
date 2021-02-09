import React, { useState } from 'react';
import { Button, Icon } from '../..';

export interface DropDownProps {
  id?: string;
  text: string;
  items: DropDownItem[];
  onItemClick: (item: DropDownItem) => void;
}

export interface DropDownItem {
  text: string;
  key: string;
}

export function DropDown({ id, text, items, onItemClick }: DropDownProps): JSX.Element {
  const [isActive, setActive] = useState(false);
  return (
    <div>
      <Button id={id} onClick={() => setActive(!isActive)}>
        {text} <Icon icon="chevron-down" />
      </Button>
      {isActive ? (
        <ul className="dd dropdown-menu has-background segment">
          {items.map((item) => (
            <li
              key={item.key}
              className="dd text-button hoverable"
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
