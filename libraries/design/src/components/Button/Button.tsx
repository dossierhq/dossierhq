import type { FunctionComponent, MouseEventHandler, ReactNode, Ref } from 'react';
import React, { forwardRef } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { IconName } from '../index.js';
import { Icon } from '../index.js';

export interface ButtonProps {
  ref?: Ref<HTMLButtonElement>;
  disabled?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  light?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

export const Button: FunctionComponent<ButtonProps> = forwardRef(
  ({ disabled, iconLeft, iconRight, light, onClick, children }: ButtonProps, ref) => {
    const className = toClassName('button', light && 'is-light');
    return (
      <button ref={ref} className={className} onClick={onClick} disabled={disabled}>
        {iconLeft ? <Icon icon={iconLeft} /> : null}
        {iconLeft || iconRight ? <span>{children}</span> : children}
        {iconRight ? <Icon icon={iconRight} /> : null}
      </button>
    );
  }
);
Button.displayName = 'Button';
