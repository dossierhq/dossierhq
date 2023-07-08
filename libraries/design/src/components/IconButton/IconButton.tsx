import type { FunctionComponent, MouseEventHandler } from 'react';
import type { Color } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { Button } from '../Button/Button.js';
import type { IconName, IconProps } from '../Icon/Icon.js';
import { Icon } from '../Icon/Icon.js';

export interface IconButtonProps {
  className?: string;
  color?: Color;
  disabled?: boolean;
  icon: IconName;
  toggled?: boolean;
  size?: IconProps['size'];
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
}

export interface IconButtonGroupProps {
  condensed?: boolean;
  skipBottomMargin?: boolean;
  children: React.ReactNode;
}

interface IconButtonComponent extends FunctionComponent<IconButtonProps> {
  Group: FunctionComponent<IconButtonGroupProps>;
}

export const IconButton: IconButtonComponent = ({
  className,
  color,
  disabled,
  icon,
  size,
  toggled,
  onClick,
  onMouseDown,
}: IconButtonProps) => {
  return (
    <Button
      className={className}
      color={color}
      onClick={onClick}
      onMouseDown={onMouseDown}
      disabled={disabled}
    >
      <Icon className={toggled ? 'icon-toggled' : undefined} icon={icon} size={size} />
    </Button>
  );
};
IconButton.displayName = 'IconButton';

IconButton.Group = ({ condensed, skipBottomMargin, children }: IconButtonGroupProps) => {
  const className = toClassName(
    'buttons',
    condensed && 'has-addons',
    skipBottomMargin && 'no-bottom-margin',
  );
  return <div className={className}>{children}</div>;
};
IconButton.Group.displayName = 'IconButton.Group';
