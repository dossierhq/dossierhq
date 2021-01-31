import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { IconButton } from './IconButton';
import type { IconButtonProps } from './IconButton';

export default {
  title: 'Components/IconButton',
  component: IconButton,
};

const Template: Story<IconButtonProps> = (args) => {
  return <IconButton {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { icon: 'remove', ariaLabel: 'Remove' };

export const Disabled = Template.bind({});
Disabled.args = { icon: 'remove', ariaLabel: 'Remove', disabled: true };
