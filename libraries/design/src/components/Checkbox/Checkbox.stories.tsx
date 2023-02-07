import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { CheckboxProps } from './Checkbox.js';
import { Checkbox } from './Checkbox.js';

type StoryProps = CheckboxProps;

const meta: Meta<CheckboxProps> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { children: 'Label' },
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <Checkbox {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const Checked = Template.bind({});
Checked.args = { checked: true };

export const Disabled = Template.bind({});
Disabled.args = { disabled: true };

export const LabelWithLink = Template.bind({});
LabelWithLink.args = {
  children: (
    <>
      Hello{' '}
      <a
        onClick={() => {
          // do nothing
        }}
      >
        World
      </a>
    </>
  ),
};
