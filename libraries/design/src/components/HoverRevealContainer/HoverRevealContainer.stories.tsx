import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { HoverRevealContainerProps } from './HoverRevealContainer.js';
import { HoverRevealContainer } from './HoverRevealContainer.js';

type StoryProps = HoverRevealContainerProps;

const meta: Meta<HoverRevealContainerProps> = {
  title: 'Components/HoverRevealContainer',
  component: HoverRevealContainer,
  args: {},
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <HoverRevealContainer {...args} />;
};

export const Row = Template.bind({});
Row.args = {
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
};

export const RowLeftIsVisible = Template.bind({});
RowLeftIsVisible.args = {
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
};

export const Nested = Template.bind({});
Nested.args = {
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
};
