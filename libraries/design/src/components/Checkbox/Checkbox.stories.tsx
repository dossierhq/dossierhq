import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Checkbox } from './Checkbox.js';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { children: 'Label' },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: {} };

export const Checked: Story = { args: { checked: true } };

export const Disabled: Story = { args: { disabled: true } };

export const LabelWithLink: Story = {
  args: {
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
  },
};
