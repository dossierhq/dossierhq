import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '../Button/Button.js';
import { Input } from '../Input/Input.js';
import { Field } from './Field.js';

const meta = {
  title: 'Components/Field',
  component: Field,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof Field>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: (
      <>
        <Field.Label>Label</Field.Label>
        <Field.Control>
          <Input />
        </Field.Control>
      </>
    ),
  },
};

export const Help: Story = {
  args: {
    children: (
      <>
        <Field.Label>Label</Field.Label>
        <Field.Control>
          <Input />
        </Field.Control>
        <Field.Help>Help</Field.Help>
      </>
    ),
  },
};

export const HelpDanger: Story = {
  args: {
    children: (
      <>
        <Field.Label>Label</Field.Label>
        <Field.Control>
          <Input color="danger" />
        </Field.Control>
        <Field.Help color="danger">Help</Field.Help>
      </>
    ),
  },
};

export const SmallLabel: Story = {
  args: {
    children: (
      <>
        <Field.Label size="small">Label</Field.Label>
        <Field.Control>
          <Input />
        </Field.Control>
      </>
    ),
  },
};

export const GroupedControls: Story = {
  args: {
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
  },
};

export const Horizontal: Story = {
  args: {
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
  },
};
