import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { IconButtonProps } from './IconButton.js';
import { IconButton } from './IconButton.js';

const meta: Meta<IconButtonProps> = {
  title: 'Components/IconButton',
  component: IconButton,
  args: {},
  argTypes: { onClick: { action: 'clicked' } },
  tags: ['autodocs'],
};
export default meta;

const Template: Story<IconButtonProps> = (args) => {
  return <IconButton {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { icon: 'add' };

export const Primary = Template.bind({});
Primary.args = { icon: 'add', color: 'primary' };

export const Disabled = Template.bind({});
Disabled.args = { disabled: true, icon: 'add' };

export const Toggled = Template.bind({});
Toggled.args = { toggled: true, icon: 'add' };

export const Large = Template.bind({});
Large.args = { icon: 'add', size: 'large' };

export const White = Template.bind({});
White.args = { icon: 'add', color: 'white' };
