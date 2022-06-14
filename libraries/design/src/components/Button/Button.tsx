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
  title?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

export interface ButtonGroupProps {
  centered?: boolean;
  hasAddons?: boolean;
  children: ReactNode;
}

interface ButtonComponent extends FunctionComponent<ButtonProps> {
  Group: FunctionComponent<ButtonGroupProps>;
}

const ButtonWithRef: FunctionComponent<ButtonProps> = forwardRef(
  (
    {
      className,
      disabled,
      iconLeft,
      iconRight,
      color,
      style,
      title,
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
        title={title}
        onClick={onClick}
        onMouseDown={onMouseDown}
        disabled={disabled}
      >
        {iconLeft ? <Icon icon={iconLeft} /> : null}
        {(iconLeft || iconRight) && children ? <span>{children}</span> : children}
        {iconRight ? <Icon icon={iconRight} /> : null}
      </button>
    );
  }
);
ButtonWithRef.displayName = 'Button';

export const Button = ButtonWithRef as ButtonComponent;

Button.Group = ({ centered, hasAddons, children }: ButtonGroupProps) => {
  return (
    <div className={toClassName('buttons', centered && 'is-centered', hasAddons && 'has-addons')}>
      {children}
    </div>
  );
};
Button.Group.displayName = 'Button.Group';
