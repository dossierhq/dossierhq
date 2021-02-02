import React from 'react';
import type { IconType } from '..';
import { Icon } from '..';

export interface IconButtonProps {
  icon: IconType;
  title: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function IconButton({ icon, title, disabled, onClick }: IconButtonProps): JSX.Element {
  return (
    <button
      className="dd button icon-button"
      title={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      type="button"
    >
      <Icon icon={icon} />
    </button>
  );
}
