import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { IconProps } from './Icon';
import { Icon } from './Icon';

const meta: Meta<IconProps> = {
  title: 'Components/Icon',
  component: Icon,
  args: {},
};
export default meta;

const Template: Story<IconProps> = (args) => {
  return <Icon {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { icon: 'chevronDown' };

export const Empty = Template.bind({});
Empty.args = { icon: null };
