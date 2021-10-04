import type { MouseEventHandler, ReactNode } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { IconName } from '../index.js';
import { Icon } from '../index.js';

export interface ButtonProps {
  disabled?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

export function Button({
  disabled,
  iconLeft,
  iconRight,
  onClick,
  children,
}: ButtonProps): JSX.Element {
  const className = toClassName('button');
  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {iconLeft ? <Icon icon={iconLeft} /> : null}
      {iconLeft || iconRight ? <span>{children}</span> : children}
      {iconRight ? <Icon icon={iconRight} /> : null}
    </button>
  );
}
