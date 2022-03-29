import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { SelectDisplayProps } from './SelectDisplay.js';
import { SelectDisplay } from './SelectDisplay.js';

const meta: Meta<SelectDisplayProps> = {
  title: 'Components/SelectDisplay',
  component: SelectDisplay,
  args: {},
  argTypes: {
    onChange: {
      action: 'on-change',
    },
  },
  parameters: { layout: 'centered' },
};
export default meta;

const Template: Story<SelectDisplayProps> = ({ children, ...args }: SelectDisplayProps) => {
  return <SelectDisplay {...args}>{children}</SelectDisplay>;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <SelectDisplay.Option value="one">One</SelectDisplay.Option>
      <SelectDisplay.Option value="two">Two</SelectDisplay.Option>
      <SelectDisplay.Option value="three">Three</SelectDisplay.Option>
    </>
  ),
};
