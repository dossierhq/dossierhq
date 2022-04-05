import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { InputProps } from './Input.js';
import { Input } from './Input.js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface StoryProps extends InputProps {}

const meta: Meta<InputProps> = {
  title: 'Components/Input',
  component: Input,
  args: {},
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <Input {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const Placeholder = Template.bind({});
Placeholder.args = { placeholder: 'Placeholder' };

export const ReadOnly = Template.bind({});
ReadOnly.args = { value: 'Read only', readOnly: true };

export const LeftIcon = Template.bind({});
LeftIcon.args = { iconLeft: 'map' };
