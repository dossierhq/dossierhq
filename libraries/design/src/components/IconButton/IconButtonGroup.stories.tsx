import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { IconButtonGroupProps } from './IconButton.js';
import { IconButton } from './IconButton.js';

const meta: Meta<IconButtonGroupProps> = {
  title: 'Components/IconButton.Group',
  component: IconButton.Group,
  args: {},
  tags: ['autodocs'],
};
export default meta;

const Template: Story<IconButtonGroupProps> = (args) => {
  return <IconButton.Group {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <IconButton icon="previous" />
      <IconButton icon="next" />
    </>
  ),
};

export const Condensed = Template.bind({});
Condensed.args = {
  condensed: true,
  children: (
    <>
      <IconButton icon="previous" />
      <IconButton icon="next" />
    </>
  ),
};
