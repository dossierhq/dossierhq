import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { DropdownSelectorProps } from './DropdownSelector';
import { DropdownSelector } from './DropdownSelector';

const meta: Meta<DropdownSelectorProps> = {
  title: 'Components/DropdownSelector',
  component: DropdownSelector,
  args: {
    label: 'Select',
  },
};
export default meta;

const Template: Story<DropdownSelectorProps> = (args) => {
  return <DropdownSelector {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <DropdownSelector.Item value="one">One</DropdownSelector.Item>
      <DropdownSelector.Item value="two" active>
        Two
      </DropdownSelector.Item>
      <DropdownSelector.Item value="three">Three</DropdownSelector.Item>
    </>
  ),
};
