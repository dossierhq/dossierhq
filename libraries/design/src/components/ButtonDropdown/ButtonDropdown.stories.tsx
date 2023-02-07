import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { ButtonDropdownProps } from './ButtonDropdown.js';
import { ButtonDropdown } from './ButtonDropdown.js';

interface StoryItem {
  id: string;
  name: string;
}

type StoryProps = ButtonDropdownProps<StoryItem>;

const meta: Meta<StoryProps> = {
  title: 'Components/ButtonDropdown',
  component: ButtonDropdown,
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
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return <ButtonDropdown {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const Disabled = Template.bind({});
Disabled.args = { disabled: true };

export const ActiveItem = Template.bind({});
ActiveItem.args = { activeItemIds: ['two'] };

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

export const Sneaky = Template.bind({});
Sneaky.args = { sneaky: true };

export const Empty = Template.bind({});
Empty.args = { children: undefined };
