import type { DropdownItem, DropdownProps } from '../Dropdown/Dropdown.js';
import { Dropdown } from '../Dropdown/Dropdown.js';
import type { IconName } from '../index.js';
import { Button } from '../index.js';

export interface ButtonDropdownProps<TItem extends DropdownItem = DropdownItem>
  extends Omit<DropdownProps<HTMLButtonElement, TItem>, 'renderTrigger'> {
  id?: string;
  iconLeft?: IconName;
  disabled?: boolean;
  sneaky?: boolean;
  children?: React.ReactNode;
}

export function ButtonDropdown<TItem extends DropdownItem>({
  id,
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
