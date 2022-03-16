import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { ButtonWithDropDown } from './ButtonWithDropDown';
import type { ButtonWithDropDownProps } from './ButtonWithDropDown';

const meta: Meta<ButtonWithDropDownProps> = {
  title: 'Generic/ButtonWithDropDown',
  component: ButtonWithDropDown,
  args: {},
};
export default meta;

const Template: Story<ButtonWithDropDownProps> = (args) => {
  return <ButtonWithDropDown {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: 'Text',
  items: [
    { key: '1', text: 'One' },
    { key: '2', text: 'Two' },
  ],
};

export const NoItems = Template.bind({});
NoItems.args = {
  children: 'Text',
  items: [],
};
