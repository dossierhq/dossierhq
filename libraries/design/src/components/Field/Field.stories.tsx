import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { Button } from '../Button/Button.js';
import { Input } from '../Input/Input.js';
import type { FieldProps } from './Field.js';
import { Field } from './Field.js';

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

export const Help = Template.bind({});
Help.args = {
  children: (
    <>
      <Field.Label>Label</Field.Label>
      <Field.Control>
        <Input />
      </Field.Control>
      <Field.Help>Help</Field.Help>
    </>
  ),
};

export const HelpDanger = Template.bind({});
HelpDanger.args = {
  children: (
    <>
      <Field.Label>Label</Field.Label>
      <Field.Control>
        <Input color="danger" />
      </Field.Control>
      <Field.Help color="danger">Help</Field.Help>
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

export const GroupedControls = Template.bind({});
GroupedControls.args = {
  grouped: true,
  children: (
    <>
      <Field.Control>
        <Button>One</Button>
      </Field.Control>
      <Field.Control>
        <Input />
      </Field.Control>
      <Field.Control>
        <Button>Three</Button>
      </Field.Control>
    </>
  ),
};

export const Horizontal = Template.bind({});
Horizontal.args = {
  horizontal: true,
  children: (
    <>
      <Field.LabelColumn>
        <Field.Label>Label</Field.Label>
      </Field.LabelColumn>
      <Field.BodyColumn>
        <Field>
          <Field.Control>
            <Input />
          </Field.Control>
        </Field>
      </Field.BodyColumn>
    </>
  ),
};
