import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Row } from './Row.js';

const meta = {
  title: 'Components/Row',
  component: Row,
  tags: ['autodocs'],
} satisfies Meta<typeof Row>;
export default meta;

type Story = StoryObj<typeof meta>;

export const TwoItemsWithGap: Story = {
  args: {
    gap: 3,
    children: (
      <>
        <Row.Item style={{ background: 'green', width: '1em', height: '1em' }} />
        <Row.Item style={{ background: 'blue', width: '1em', height: '1em' }} />
      </>
    ),
  },
};

export const ThreeItems: Story = {
  args: {
    children: (
      <>
        <Row.Item style={{ background: 'green', width: '1em', height: '1em' }} />
        <Row.Item style={{ width: '1em', height: '1em' }} />
        <Row.Item style={{ background: 'blue', width: '1em', height: '1em' }} />
      </>
    ),
  },
};
