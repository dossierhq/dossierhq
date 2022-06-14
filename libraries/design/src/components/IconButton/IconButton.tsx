import type { FunctionComponent, MouseEventHandler } from 'react';
import type { IconName } from '../index.js';
import { Button, Icon } from '../index.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { Color } from '../../config/Colors.js';
import type { IconProps } from '../Icon/Icon.js';

export interface IconButtonProps {
  className?: string;
  color?: Color;
  disabled?: boolean;
  icon: IconName;
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
      <Icon icon={icon} size={size} />
    </Button>
  );
};
IconButton.displayName = 'IconButton';

IconButton.Group = ({ condensed, skipBottomMargin, children }: IconButtonGroupProps) => {
  const className = toClassName(
    'buttons',
    condensed && 'has-addons',
    skipBottomMargin && 'no-bottom-margin'
  );
  return <div className={className}>{children}</div>;
};
IconButton.Group.displayName = 'IconButton.Group';
