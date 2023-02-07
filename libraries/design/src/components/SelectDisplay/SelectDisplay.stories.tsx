import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SelectDisplay } from './SelectDisplay.js';

const meta = {
  title: 'Components/SelectDisplay',
  component: SelectDisplay,
  args: {},
  argTypes: {
    onChange: {
      action: 'on-change',
    },
  },
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SelectDisplay>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: (
      <>
        <SelectDisplay.Option value="one">One</SelectDisplay.Option>
        <SelectDisplay.Option value="two">Two</SelectDisplay.Option>
        <SelectDisplay.Option value="three">Three</SelectDisplay.Option>
      </>
    ),
  },
};

export const Fullscreen: Story = {
  args: {
    fullWidth: true,
    children: (
      <>
        <SelectDisplay.Option value="one">One</SelectDisplay.Option>
        <SelectDisplay.Option value="two">Two</SelectDisplay.Option>
        <SelectDisplay.Option value="three">Three</SelectDisplay.Option>
      </>
    ),
  },
  parameters: { layout: 'fullscreen' },
};
