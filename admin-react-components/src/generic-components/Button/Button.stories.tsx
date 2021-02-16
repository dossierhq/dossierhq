import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { Button } from './Button';
import type { ButtonProps } from './Button';
import { Icon } from '../..';

export default {
  title: 'Generic/Button',
  component: Button,
  args: {},
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

export const PrimaryIcon = Template.bind({});
PrimaryIcon.args = {
  className: 'bg-primary',
  children: (
    <>
      Text <Icon icon="chevron-down" />
    </>
  ),
};

export const PrimaryDisabled = Template.bind({});
PrimaryDisabled.args = { className: 'bg-primary', children: 'Text', disabled: true };

export const SubmitNormal = Template.bind({});
SubmitNormal.args = { children: 'Done', type: 'submit' };

export const SubmitLoading = Template.bind({});
SubmitLoading.args = {
  children: 'Done',
  type: 'submit',
  loading: true,
};
