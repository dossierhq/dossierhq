import React from 'react';
import type { IconType } from '../..';
import { Icon } from '../..';
import { joinClassNames } from '../../utils/ClassNameUtils';

export interface IconButtonProps {
  id?: string;
  className?: string;
  icon: IconType;
  title: string;
  disabled?: boolean;
  dataTestId?: string;
  onClick?: () => void;
}

export function IconButton({
  id,
  className,
  icon,
  title,
  disabled,
  dataTestId,
  onClick,
}: IconButtonProps): JSX.Element {
  return (
    <button
      id={id}
      className={joinClassNames('dd-icon-button', className)}
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
