import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { Badge } from '../Badge/Badge.js';
import type { ButtonProps } from './Button.js';
import { Button } from './Button.js';

type StoryProps = ButtonProps;

const meta: Meta<ButtonProps> = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Button' },
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <Button {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const Primary = Template.bind({});
Primary.args = { color: 'primary' };

export const Disabled = Template.bind({});
Disabled.args = { disabled: true };

export const Title = Template.bind({});
Title.args = { title: 'Button title' };

export const LeftIcon = Template.bind({});
LeftIcon.args = { iconLeft: 'add' };

export const RightIconOnly = Template.bind({});
RightIconOnly.args = { iconRight: 'chevronDown', children: undefined };

export const WithBadge = Template.bind({});
WithBadge.args = {
  children: (
    <>
      Badge<Badge>123</Badge>
    </>
  ),
};

export const Light = Template.bind({});
Light.args = { color: 'light' };

export const Anchor = Template.bind({});
Anchor.args = { as: 'a', href: 'javascript: alert("Clicked")' };
