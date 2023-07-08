import type { CSSProperties, FunctionComponent, MouseEventHandler, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import type { Color } from '../../config/Colors.js';
import { toColorClassName } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { IconName } from '../Icon/Icon.js';
import { Icon } from '../Icon/Icon.js';

export type ButtonProps = {
  ref?: Ref<HTMLAnchorElement | HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
  iconLeft?: IconName;
  iconRight?: IconName;
  color?: Color;
  title?: string;
  children: ReactNode;
} & (
  | { as: 'a'; href?: string; target?: string }
  | {
      as?: 'button';
      disabled?: boolean;
      onClick?: MouseEventHandler<HTMLButtonElement>;
      onMouseDown?: MouseEventHandler<HTMLButtonElement>;
    }
);

export interface ButtonGroupProps {
  centered?: boolean;
  hasAddons?: boolean;
  noBottomMargin?: boolean;
  children: ReactNode;
}

interface ButtonComponent extends FunctionComponent<ButtonProps> {
  Group: FunctionComponent<ButtonGroupProps>;
}

const ButtonWithRef: FunctionComponent<ButtonProps> = forwardRef(
  (
    { className, iconLeft, iconRight, color, style, title, children, ...props }: ButtonProps,
    ref,
  ) => {
    const realClassName = toClassName('button', toColorClassName(color), className);
    const content = (
      <>
        {iconLeft ? <Icon icon={iconLeft} /> : null}
        {(iconLeft || iconRight) && children ? <span>{children}</span> : children}
        {iconRight ? <Icon icon={iconRight} /> : null}
      </>
    );

    if (props.as === 'a') {
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          className={realClassName}
          href={props.href}
          target={props.target}
          style={style}
          title={title}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        className={realClassName}
        style={style}
        title={title}
        onClick={props.onClick}
        onMouseDown={props.onMouseDown}
        disabled={props.disabled}
      >
        {content}
      </button>
    );
  },
);
ButtonWithRef.displayName = 'Button';

export const Button = ButtonWithRef as ButtonComponent;

Button.Group = ({ centered, hasAddons, noBottomMargin, children }: ButtonGroupProps) => {
  return (
    <div
      className={toClassName(
        'buttons',
        centered && 'is-centered',
        hasAddons && 'has-addons',
        noBottomMargin && 'mb-0',
      )}
    >
      {children}
    </div>
  );
};
Button.Group.displayName = 'Button.Group';
