import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { IconButton } from './IconButton.js';

const meta = {
  title: 'Components/IconButton.Group',
  component: IconButton.Group,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof IconButton.Group>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: (
      <>
        <IconButton icon="previous" />
        <IconButton icon="next" />
      </>
    ),
  },
};

export const Condensed: Story = {
  args: {
    condensed: true,
    children: (
      <>
        <IconButton icon="previous" />
        <IconButton icon="next" />
      </>
    ),
  },
};
