import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { DropdownSelector2Props } from './DropdownSelector2.js';
import { DropdownSelector2, Item } from './DropdownSelector2.js';

interface StoryItem {
  id: string;
  name: string;
}

type StoryProps = DropdownSelector2Props<StoryItem>;

const meta: Meta<StoryProps> = {
  title: 'Components/DropdownSelector2',
  component: DropdownSelector2,
  args: {},
  parameters: { layout: 'centered' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return <Wrapper {...args} />;
};

function Wrapper({ ...args }: StoryProps) {
  return <DropdownSelector2 {...args} />;
}

export const Normal = Template.bind({});
Normal.args = {
  children: (item: StoryItem) => <Item key={item.id}>{item.name}</Item>,
  items: [{ id: 'one', name: 'One' }],
};
