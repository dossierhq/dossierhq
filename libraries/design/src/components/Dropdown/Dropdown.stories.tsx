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
  args: { renderItem: (item) => item.name },
  argTypes: { onItemClick: { action: 'clicked' } },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return <Dropdown {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  text: 'Select',
  items: [
    { id: 'one', name: 'One' },
    { id: 'two', name: 'Two' },
    { id: 'three', name: 'Three' },
  ],
};
