import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { IconButtonProps } from './IconButton';
import { IconButton } from './IconButton';

const meta: Meta<IconButtonProps> = {
  title: 'Components/IconButton',
  component: IconButton,
  args: {},
  argTypes: { onClick: { action: 'clicked' } },
};
export default meta;

const Template: Story<IconButtonProps> = (args) => {
  return <IconButton {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { icon: 'add' };

export const Disabled = Template.bind({});
Disabled.args = { disabled: true, icon: 'add' };
