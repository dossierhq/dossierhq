import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { Button } from './Button';
import type { ButtonProps } from './Button';

export default {
  title: 'Generic/Button',
  component: Button,
};

const Template: Story<ButtonProps> = (args) => {
  return <Button {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { children: 'Text' };

export const Disabled = Template.bind({});
Disabled.args = { children: 'Text', disabled: true };

export const Primary = Template.bind({});
Primary.args = { className: 'bg-primary', children: 'Text' };

export const PrimaryDisabled = Template.bind({});
PrimaryDisabled.args = { className: 'bg-primary', children: 'Text', disabled: true };

export const SubmitNormal = Template.bind({});
SubmitNormal.args = { children: 'Done', type: 'submit' };
