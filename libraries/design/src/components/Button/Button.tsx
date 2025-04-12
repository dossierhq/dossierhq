import {
  forwardRef,
  type CSSProperties,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
} from 'react';
import { toColorClassName, type Color } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { Icon, type IconName } from '../Icon/Icon.js';

type ButtonProps = {
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
      type?: 'button' | 'submit' | 'reset';
      onClick?: MouseEventHandler<HTMLButtonElement>;
      onMouseDown?: MouseEventHandler<HTMLButtonElement>;
    }
);

export const Button = forwardRef(
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
        type={props.type}
      >
        {content}
      </button>
    );
  },
);
Button.displayName = 'Button';
