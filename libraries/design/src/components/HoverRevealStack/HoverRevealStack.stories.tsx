import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Delete } from '../Delete/Delete.js';
import { HoverRevealStack } from './HoverRevealStack.js';

const meta = {
  title: 'Components/HoverRevealStack',
  component: HoverRevealStack,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof HoverRevealStack>;
export default meta;

type Story = StoryObj<typeof meta>;

export const TopRight: Story = {
  args: {
    children: (
      <>
        <HoverRevealStack.Item top right>
          <span style={{ backgroundColor: 'pink' }}>Top right</span>
        </HoverRevealStack.Item>
        <div style={{ background: 'green', height: '4em' }} />
      </>
    ),
  },
};

export const Corners: Story = {
  args: {
    children: (
      <>
        <HoverRevealStack.Item top left>
          <p style={{ background: 'yellow' }}>top-left</p>
        </HoverRevealStack.Item>
        <HoverRevealStack.Item top right>
          <p style={{ background: 'yellow' }}>top-right</p>
        </HoverRevealStack.Item>
        <HoverRevealStack.Item bottom left>
          <p style={{ background: 'yellow' }}>bottom-left</p>
        </HoverRevealStack.Item>
        <HoverRevealStack.Item bottom right>
          <p style={{ background: 'yellow' }}>bottom-right</p>
        </HoverRevealStack.Item>
        <div style={{ background: 'green', height: '4em' }} />
      </>
    ),
  },
};

export const DeleteTopRight: Story = {
  args: {
    children: (
      <>
        <HoverRevealStack.Item top right>
          <Delete />
        </HoverRevealStack.Item>
        <div style={{ background: 'green', height: '4em' }} />
      </>
    ),
  },
};
