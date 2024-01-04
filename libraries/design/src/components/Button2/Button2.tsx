import type { MouseEventHandler, ReactNode } from 'react';
import { Button as ReactAriaButton } from 'react-aria-components';
import { toColorClassName, type Color } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { Icon, type IconName } from '../Icon/Icon.js';

interface Props {
  children: ReactNode;
  className?: string;
  color?: Color;
  iconLeft?: IconName;
  iconRight?: IconName;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function Button2({ className, color, iconLeft, iconRight, children, ...props }: Props) {
  const realClassName = toClassName('button', toColorClassName(color), className);
  const content = (
    <>
      {iconLeft ? <Icon icon={iconLeft} /> : null}
      {(iconLeft || iconRight) && children ? <span>{children}</span> : children}
      {iconRight ? <Icon icon={iconRight} /> : null}
    </>
  );

  return (
    <ReactAriaButton className={realClassName} {...{ props }}>
      {content}
    </ReactAriaButton>
  );
}
