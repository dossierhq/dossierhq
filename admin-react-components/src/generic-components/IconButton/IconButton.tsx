import React from 'react';
import type { IconType } from '../..';
import { Icon } from '../..';

export interface IconButtonProps {
  icon: IconType;
  title: string;
  disabled?: boolean;
  dataTestId?: string;
  onClick?: () => void;
}

export function IconButton({
  icon,
  title,
  disabled,
  dataTestId,
  onClick,
}: IconButtonProps): JSX.Element {
  return (
    <button
      className="dd button icon-button"
      title={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      type="button"
      data-testid={dataTestId}
    >
      <Icon icon={icon} />
    </button>
  );
}
