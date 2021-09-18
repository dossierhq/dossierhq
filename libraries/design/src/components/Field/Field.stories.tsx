import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { Input } from '..';
import type { FieldProps } from './Field';
import { Field } from './Field';

const meta: Meta<FieldProps> = {
  title: 'Components/Field',
  component: Field,
  args: {},
};
export default meta;

const Template: Story<FieldProps> = (args) => {
  return <Field {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <Field.Label>Label</Field.Label>
      <Field.Control>
        <Input />
      </Field.Control>
    </>
  ),
};

export const SmallLabel = Template.bind({});
SmallLabel.args = {
  children: (
    <>
      <Field.Label size="small">Label</Field.Label>
      <Field.Control>
        <Input />
      </Field.Control>
    </>
  ),
};
