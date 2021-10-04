import type { FunctionComponent, MouseEventHandler, ReactNode } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface DropdownDisplayProps {
  active?: boolean;
  up?: boolean;
  left?: boolean;
  trigger: ReactNode;
  children: ReactNode;
}

export interface DropdownDisplayItemProps {
  active?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
}

interface DropdownDisplayComponent extends FunctionComponent<DropdownDisplayProps> {
  Item: FunctionComponent<DropdownDisplayItemProps>;
}

export const DropdownDisplay: DropdownDisplayComponent = ({
  active,
  up,
  left,
  trigger,
  children,
}: DropdownDisplayProps) => {
  return (
    <div
      className={toClassName('dropdown', active && 'is-active', up && 'is-up', left && 'is-right')}
    >
      <div className="dropdown-trigger">{trigger}</div>
      <div className="dropdown-menu" role="menu">
        <div className="dropdown-content">{children}</div>
      </div>
    </div>
  );
};
DropdownDisplay.displayName = 'DropdownDisplay';

DropdownDisplay.Item = ({ active, onClick, children }: DropdownDisplayItemProps) => {
  return (
    <a className={toClassName('dropdown-item', active && 'is-active')} onClick={onClick}>
      {children}
    </a>
  );
};
DropdownDisplay.Item.displayName = 'DropdownDisplay.Item';
