import type { FunctionComponent, MouseEventHandler } from 'react';
import React from 'react';
import type { IconName } from '../index.js';
import { Button, Icon } from '../index.js';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface IconButtonProps {
  disabled?: boolean;
  icon: IconName;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export interface IconButtonGroupProps {
  condensed?: boolean;
  skipBottomMargin?: boolean;
  children: React.ReactNode;
}

interface IconButtonComponent extends FunctionComponent<IconButtonProps> {
  Group: FunctionComponent<IconButtonGroupProps>;
}

export const IconButton: IconButtonComponent = ({ disabled, icon, onClick }: IconButtonProps) => {
  return (
    <Button onClick={onClick} disabled={disabled}>
      <Icon icon={icon} />
    </Button>
  );
};
IconButton.displayName = 'IconButton';

IconButton.Group = ({ condensed, skipBottomMargin, children }: IconButtonGroupProps) => {
  const className = toClassName(
    'buttons',
    condensed && 'has-addons',
    skipBottomMargin && 'no-bottom-margin'
  );
  return <div className={className}>{children}</div>;
};
IconButton.Group.displayName = 'IconButton.Group';
