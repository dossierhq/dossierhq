import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { Button } from './Button';
import type { ButtonProps } from './Button';
import { Icon } from '../..';

const meta: Meta<ButtonProps> = {
  title: 'Generic/Button',
  component: Button,
  args: {},
};
export default meta;

const Template: Story<ButtonProps> = (args) => {
  return <Button {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { children: 'Text' };

export const Disabled = Template.bind({});
Disabled.args = { children: 'Text', disabled: true };

export const Primary = Template.bind({});
Primary.args = { kind: 'primary', children: 'Text' };

export const PrimaryIcon = Template.bind({});
PrimaryIcon.args = {
  kind: 'primary',
  children: (
    <>
      Text <Icon icon="chevron-down" />
    </>
  ),
};

export const PrimaryDisabled = Template.bind({});
PrimaryDisabled.args = { kind: 'primary', children: 'Text', disabled: true };

export const PrimarySelected = Template.bind({});
PrimarySelected.args = { kind: 'primary', children: 'Text', selected: true };

export const PrimaryLoading = Template.bind({});
PrimaryLoading.args = { kind: 'primary', children: 'Text', loading: true };

export const SubmitNormal = Template.bind({});
SubmitNormal.args = { children: 'Done', type: 'submit' };

export const SubmitLoading = Template.bind({});
SubmitLoading.args = {
  children: 'Done',
  type: 'submit',
  loading: true,
};

export const ResetNormal = Template.bind({});
ResetNormal.args = { children: 'Reset', type: 'reset' };
