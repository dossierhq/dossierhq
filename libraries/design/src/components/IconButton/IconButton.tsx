import type { FunctionComponent, MouseEventHandler } from 'react';
import React from 'react';
import { Button } from 'react-bulma-components';
import type { IconName } from '..';
import { Icon } from '..';
import { toClassName } from '../../utils/ClassNameUtils';

export interface IconButtonProps {
  disabled?: boolean;
  icon: IconName;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export interface IconButtonGroupProps {
  condensed?: boolean;
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

IconButton.Group = ({ condensed, children }: IconButtonGroupProps) => {
  const className = toClassName('buttons', condensed && 'has-addons');
  return <div className={className}>{children}</div>;
};
IconButton.Group.displayName = 'IconButton.Group';
