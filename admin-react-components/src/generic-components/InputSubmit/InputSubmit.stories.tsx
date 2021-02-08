import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { InputSubmit } from './InputSubmit';
import type { InputSubmitProps } from './InputSubmit';

export default {
  title: 'Generic/InputSubmit',
  component: InputSubmit,
};

const Template: Story<InputSubmitProps> = (args) => {
  return <InputSubmit {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { value: 'Done' };

export const Disabled = Template.bind({});
Disabled.args = { value: 'Done', disabled: true };
