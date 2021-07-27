import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useState } from 'react';
import type { CheckboxProps } from './Checkbox';
import { Checkbox } from './Checkbox';

const meta: Meta<CheckboxProps> = {
  title: 'Generic/Checkbox',
  component: Checkbox,
};
export default meta;

function ControlledCheckbox(props: CheckboxProps) {
  const [checked, setChecked] = useState(props.checked);
  return <Checkbox {...props} checked={checked} onChange={setChecked} />;
}

const Template: Story<CheckboxProps> = (args) => {
  return <ControlledCheckbox {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const Checked = Template.bind({});
Checked.args = { checked: true };
