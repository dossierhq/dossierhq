import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Level } from './Level.js';

const meta = {
  title: 'Components/Level',
  component: Level,
  tags: ['autodocs'],
} satisfies Meta<typeof Level>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: <Level.Item>Item</Level.Item>,
  },
};

export const Padding: Story = {
  args: {
    padding: 5,
    children: <Level.Item>Item</Level.Item>,
  },
};

export const LeftRight: Story = {
  args: {
    children: (
      <>
        <Level.Left>
          <Level.Item>Left</Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>Right</Level.Item>
        </Level.Right>
      </>
    ),
  },
};

export const LeftCenterRight: Story = {
  args: {
    children: (
      <>
        <Level.Left>
          <Level.Item>Left</Level.Item>
        </Level.Left>
        <Level.Item>Center</Level.Item>
        <Level.Right>
          <Level.Item>Right</Level.Item>
        </Level.Right>
      </>
    ),
  },
};
