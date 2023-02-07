import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Column } from './Column.js';

const meta = {
  title: 'Components/Column',
  component: Column,
  tags: ['autodocs'],
} satisfies Meta<typeof Column>;
export default meta;

type Story = StoryObj<typeof meta>;

export const TwoItemsWithGap: Story = {
  args: {
    gap: 3,
    children: (
      <>
        <Column.Item style={{ background: 'green', width: '1em', height: '1em' }} />
        <Column.Item style={{ background: 'blue', width: '1em', height: '1em' }} />
      </>
    ),
  },
};

export const ThreeItems: Story = {
  args: {
    children: (
      <>
        <Column.Item style={{ background: 'green', width: '1em', height: '1em' }} />
        <Column.Item style={{ width: '1em', height: '1em' }} />
        <Column.Item style={{ background: 'blue', width: '1em', height: '1em' }} />
      </>
    ),
  },
};
