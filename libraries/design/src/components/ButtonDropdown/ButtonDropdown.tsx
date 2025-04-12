import type { JSX } from 'react';
import { Button } from '../Button/Button.js';
import { Dropdown, type DropdownItem, type DropdownProps } from '../Dropdown/Dropdown.js';
import type { IconName } from '../Icon/Icon.js';

interface ButtonDropdownProps<TItem extends DropdownItem = DropdownItem>
  extends Omit<DropdownProps<HTMLButtonElement, TItem>, 'renderTrigger'> {
  id?: string;
  className?: string;
  iconLeft?: IconName;
  disabled?: boolean;
  sneaky?: boolean;
  children?: React.ReactNode;
}

export function ButtonDropdown<TItem extends DropdownItem>({
  id,
  className,
  iconLeft,
  sneaky,
  disabled,
  children,
  ...args
}: ButtonDropdownProps<TItem>): JSX.Element {
  const color = sneaky ? 'light' : !iconLeft && !children ? 'white' : undefined;
  return (
    <Dropdown<HTMLButtonElement, TItem>
      {...args}
      renderTrigger={(triggerRef, onOpenDropdown) => (
        <Button
          ref={triggerRef}
          className={className}
          iconLeft={iconLeft}
          iconRight={sneaky ? undefined : args.up ? 'chevronUp' : 'chevronDown'}
          color={color}
          disabled={disabled}
          onMouseDown={(event) => {
            event.preventDefault();
            onOpenDropdown();
          }}
        >
          {children}
        </Button>
      )}
    />
  );
}
