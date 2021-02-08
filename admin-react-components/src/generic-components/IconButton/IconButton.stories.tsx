import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { IconButton } from './IconButton';
import type { IconButtonProps } from './IconButton';

export default {
  title: 'Generic/IconButton',
  component: IconButton,
};

const Template: Story<IconButtonProps> = (args) => {
  return <IconButton {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { icon: 'remove', title: 'Remove' };

export const Disabled = Template.bind({});
Disabled.args = { icon: 'remove', title: 'Remove', disabled: true };
