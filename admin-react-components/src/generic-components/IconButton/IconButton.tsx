import React from 'react';
import type { IconType } from '../..';
import { Icon } from '../..';
import { joinClassNames } from '../../utils/ClassNameUtils';

export interface IconButtonProps {
  className?: string;
  icon: IconType;
  title: string;
  disabled?: boolean;
  dataTestId?: string;
  onClick?: () => void;
}

export function IconButton({
  className,
  icon,
  title,
  disabled,
  dataTestId,
  onClick,
}: IconButtonProps): JSX.Element {
  return (
    <button
      className={joinClassNames('dd icon-button', className)}
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
