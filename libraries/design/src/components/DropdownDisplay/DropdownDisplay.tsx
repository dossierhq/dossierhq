import type { FunctionComponent, MouseEventHandler, ReactNode } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface DropdownDisplayProps {
  id?: string;
  className?: string;
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

export interface DropdownDisplayContentItemProps {
  children: ReactNode;
}

interface DropdownDisplayComponent extends FunctionComponent<DropdownDisplayProps> {
  Item: FunctionComponent<DropdownDisplayItemProps>;
  ContentItem: FunctionComponent<DropdownDisplayContentItemProps>;
}

export const DropdownDisplay: DropdownDisplayComponent = ({
  id,
  className,
  active,
  up,
  left,
  trigger,
  children,
}: DropdownDisplayProps) => {
  return (
    <div
      id={id}
      className={toClassName(
        'dropdown',
        active && 'is-active',
        up && 'is-up',
        left && 'is-right',
        className
      )}
    >
      <div className="dropdown-trigger is-width-100">{trigger}</div>
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

DropdownDisplay.ContentItem = ({ children }: DropdownDisplayContentItemProps) => {
  return (
    <div className="dropdown-item">
      <p>{children}</p>
    </div>
  );
};
DropdownDisplay.ContentItem.displayName = 'DropdownDisplay.ContentItem';
