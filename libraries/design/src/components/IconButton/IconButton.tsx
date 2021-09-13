import type { MouseEventHandler } from 'react';
import React from 'react';
import { Button } from 'react-bulma-components';
import type { IconName } from '..';
import { Icon } from '..';

export interface IconButtonProps {
  icon: IconName;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function IconButton({ icon, onClick }: IconButtonProps): JSX.Element {
  return (
    <Button onClick={onClick}>
      <Icon icon={icon} />
    </Button>
  );
}
