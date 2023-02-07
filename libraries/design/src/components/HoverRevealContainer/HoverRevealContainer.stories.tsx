import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { HoverRevealContainer } from './HoverRevealContainer.js';

const meta = {
  title: 'Components/HoverRevealContainer',
  component: HoverRevealContainer,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof HoverRevealContainer>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Row: Story = {
  args: {
    flexDirection: 'row',
    gap: 5,
    children: (
      <>
        <HoverRevealContainer.Item style={{ backgroundColor: 'pink' }} flexGrow={1}>
          Left
        </HoverRevealContainer.Item>
        <HoverRevealContainer.Item style={{ backgroundColor: 'burlywood' }}>
          Right
        </HoverRevealContainer.Item>
      </>
    ),
  },
};

export const RowLeftIsVisible: Story = {
  args: {
    flexDirection: 'row',
    children: (
      <>
        <HoverRevealContainer.Item style={{ backgroundColor: 'pink' }} forceVisible flexGrow={1}>
          Left
        </HoverRevealContainer.Item>
        <HoverRevealContainer.Item style={{ backgroundColor: 'burlywood' }}>
          Right
        </HoverRevealContainer.Item>
      </>
    ),
  },
};

export const Nested: Story = {
  args: {
    flexDirection: 'row',
    gap: 5,
    children: (
      <>
        <HoverRevealContainer.Item style={{ backgroundColor: 'pink' }} flexGrow={1} forceVisible>
          <p>Outer container</p>
          <HoverRevealContainer>
            <HoverRevealContainer.Item
              forceVisible
              flexGrow={1}
              style={{ backgroundColor: 'greenyellow' }}
            >
              Inner container
            </HoverRevealContainer.Item>
            <HoverRevealContainer.Item style={{ backgroundColor: 'wheat' }}>
              Inner container
            </HoverRevealContainer.Item>
          </HoverRevealContainer>
        </HoverRevealContainer.Item>
        <HoverRevealContainer.Item style={{ backgroundColor: 'burlywood' }}>
          Outer container
        </HoverRevealContainer.Item>
      </>
    ),
  },
};
