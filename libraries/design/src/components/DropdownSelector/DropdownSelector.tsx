import type { FunctionComponent } from 'react';
import React from 'react';
import { Dropdown, Icon } from 'react-bulma-components';
import { IconImage } from '..';

export interface DropdownSelectorProps {
  label: string;
  children: React.ReactElement<DropdownSelectorItemProps>;
}

interface DropdownSelectorItemProps {
  value: unknown;
  active?: boolean;
  children: React.ReactNode | JSX.Element;
}

interface DropdownSelectorComponent extends FunctionComponent<DropdownSelectorProps> {
  Item: FunctionComponent<DropdownSelectorItemProps>;
}

export const DropdownSelector: DropdownSelectorComponent = ({
  label,
  children,
}: DropdownSelectorProps) => {
  return (
    <Dropdown
      label={label}
      icon={
        <Icon>
          <IconImage icon="chevronDown" />
        </Icon>
      }
    >
      {children}
    </Dropdown>
  );
};
DropdownSelector.displayName = 'DropdownSelector';

//TODO value is rendered as title
DropdownSelector.Item = ({ active, value, children }: DropdownSelectorItemProps) => (
  // @ts-expect-error active is missing from the type
  <Dropdown.Item active={active} value={value} renderAs="a">
    {children}
  </Dropdown.Item>
);
DropdownSelector.Item.displayName = 'DropdownSelector.Item';
