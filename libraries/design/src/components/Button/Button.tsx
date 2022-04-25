import type { CSSProperties, FunctionComponent, MouseEventHandler, ReactNode, Ref } from 'react';
import React, { forwardRef } from 'react';
import type { Color } from '../../config/Colors.js';
import { toColorClassName } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { IconName } from '../index.js';
import { Icon } from '../index.js';

export interface ButtonProps {
  ref?: Ref<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  color?: Color;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

export const Button: FunctionComponent<ButtonProps> = forwardRef(
  (
    {
      className,
      disabled,
      iconLeft,
      iconRight,
      color,
      style,
      onClick,
      onMouseDown,
      children,
    }: ButtonProps,
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={toClassName('button', toColorClassName(color), className)}
        style={style}
        onClick={onClick}
        onMouseDown={onMouseDown}
        disabled={disabled}
      >
        {iconLeft ? <Icon icon={iconLeft} /> : null}
        {iconLeft || iconRight ? <span>{children}</span> : children}
        {iconRight ? <Icon icon={iconRight} /> : null}
      </button>
    );
  }
);
Button.displayName = 'Button';
