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
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

export const Button: FunctionComponent<ButtonProps> = forwardRef(
  ({ disabled, iconLeft, iconRight, onClick, children }: ButtonProps, ref) => {
    const className = toClassName('button');
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
