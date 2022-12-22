import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { DropdownSelector2 } from './DropdownSelector2.js';
import { PopoverTrigger } from './PopoverTrigger.js';

type StoryProps = {};

const meta: Meta<StoryProps> = {
  title: 'Components/PopoverTrigger',
  component: DropdownSelector2,
  args: {},
  parameters: { layout: 'centered' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return <Wrapper {...args} />;
};

function Wrapper(props: StoryProps) {
  return (
    <PopoverTrigger label="Open Popover">
      <h1>HEllo world</h1>
    </PopoverTrigger>
  );
}

export const Normal = Template.bind({});
Normal.args = {};
