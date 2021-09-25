import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { DropdownProps } from './Dropdown';
import { Dropdown } from './Dropdown';

interface StoryItem {
  id: string;
  name: string;
}

type StoryProps = DropdownProps<StoryItem>;

const meta: Meta<StoryProps> = {
  title: 'Components/Dropdown',
  component: Dropdown,
  args: {
    children: 'Select',
    items: [
      { id: 'one', name: 'One' },
      { id: 'two', name: 'Two' },
      { id: 'three', name: 'Three' },
    ],
    renderItem: (item) => item.name,
  },
  argTypes: { onItemClick: { action: 'clicked' } },
  parameters: { layout: 'centered' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return <Dropdown {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const Disabled = Template.bind({});
Disabled.args = { disabled: true };

export const IconOnly = Template.bind({});
IconOnly.args = {
  iconLeft: 'add',
  children: undefined,
};

export const IconText = Template.bind({});
IconText.args = {
  iconLeft: 'add',
};

export const Left = Template.bind({});
Left.args = { left: true };

export const Up = Template.bind({});
Up.args = { up: true };

export const UpLeft = Template.bind({});
UpLeft.args = { up: true, left: true };
