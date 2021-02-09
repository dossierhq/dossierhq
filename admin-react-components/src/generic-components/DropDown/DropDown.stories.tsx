import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DropDown } from '../..';
import type { DropDownProps } from './DropDown';

export default {
  title: 'Generic/DropDown',
  component: DropDown,
};

const Template: Story<DropDownProps> = (args) => {
  return <DropDown {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  text: 'Dropdown',
  items: [
    { key: 'one', text: 'One' },
    { key: 'two', text: 'Two' },
    { key: 'three', text: 'Three' },
  ],
};
