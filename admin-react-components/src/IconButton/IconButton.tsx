import React from 'react';
import type { IconType } from '..';
import { Icon } from '..';

export interface IconButtonProps {
  icon: IconType;
  ariaLabel: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function IconButton({ icon, ariaLabel, disabled, onClick }: IconButtonProps): JSX.Element {
  return (
    <button
      className="dd button icon-button"
      aria-label={ariaLabel}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <Icon icon={icon} />
    </button>
  );
}
