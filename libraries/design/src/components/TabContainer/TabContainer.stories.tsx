import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { TabContainer, type TabContainerProps } from './TabContainer.js';

interface StoryProps extends Omit<TabContainerProps, 'children'> {
  items: { id: string; title: string }[];
}

const meta = {
  title: 'Components/TabContainer',
  component: Wrapper,
  parameters: { layout: 'centered' },
  args: {
    items: [
      { id: '1', title: 'First' },
      { id: '2', title: 'Second' },
    ],
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

function Wrapper({ items, ...props }: StoryProps) {
  const [current, setCurrent] = useState(items[0].id);

  return (
    <TabContainer {...props}>
      {items.map((item) => (
        <TabContainer.Item
          key={item.id}
          active={current === item.id}
          onClick={() => setCurrent(item.id)}
        >
          {item.title}
        </TabContainer.Item>
      ))}
    </TabContainer>
  );
}

export const Normal: Story = {};

export const Small: Story = { args: { small: true } };
