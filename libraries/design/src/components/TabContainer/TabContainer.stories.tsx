import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React, { useState } from 'react';
import type { TabContainerProps } from './TabContainer.js';
import { TabContainer } from './TabContainer.js';

interface StoryProps extends Omit<TabContainerProps, 'children'> {
  items: { id: string; title: string }[];
}

const meta: Meta<StoryProps> = {
  title: 'Components/TabContainer',
  component: TabContainer,
  parameters: { layout: 'centered' },
  args: {
    items: [
      { id: '1', title: 'First' },
      { id: '2', title: 'Second' },
    ],
  },
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return <Wrapper {...args} />;
};

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

export const Normal = Template.bind({});
Normal.args = {};

export const Small = Template.bind({});
Small.args = { small: true };
