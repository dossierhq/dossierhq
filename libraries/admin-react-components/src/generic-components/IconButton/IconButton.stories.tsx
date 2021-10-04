import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { IconButton } from './IconButton.js';
import type { IconButtonProps } from './IconButton.js';

const meta: Meta<IconButtonProps> = {
  title: 'Generic/IconButton',
  component: IconButton,
};
export default meta;

const Template: Story<IconButtonProps> = (args) => {
  return <IconButton {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { icon: 'remove', title: 'Remove' };

export const Disabled = Template.bind({});
Disabled.args = { icon: 'remove', title: 'Remove', disabled: true };
