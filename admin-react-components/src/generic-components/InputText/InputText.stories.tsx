import type { Story } from '@storybook/react/types-6-0';
import React, { useState } from 'react';
import { InputText } from './InputText';
import type { InputTextProps } from './InputText';

export default {
  title: 'Generic/InputText',
  component: InputText,
};

function ControlledInputText(props: InputTextProps) {
  const [value, setValue] = useState(props.value);
  return <InputText {...props} value={value} onChange={setValue} />;
}

const Template: Story<InputTextProps> = (args) => {
  return <ControlledInputText {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const Number = Template.bind({});
Number.args = { type: 'number' };
