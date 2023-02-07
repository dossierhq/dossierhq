import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { Delete } from '../Delete/Delete.js';
import type { HoverRevealStackProps } from './HoverRevealStack.js';
import { HoverRevealStack } from './HoverRevealStack.js';

type StoryProps = HoverRevealStackProps;

const meta: Meta<HoverRevealStackProps> = {
  title: 'Components/HoverRevealStack',
  component: HoverRevealStack,
  args: {},
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <HoverRevealStack {...args} />;
};

export const TopRight = Template.bind({});
TopRight.args = {
  children: (
    <>
      <HoverRevealStack.Item top right>
        <span style={{ backgroundColor: 'pink' }}>Top right</span>
      </HoverRevealStack.Item>
      <div style={{ background: 'green', height: '4em' }} />
    </>
  ),
};

export const Corners = Template.bind({});
Corners.args = {
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
};

export const DeleteTopRight = Template.bind({});
DeleteTopRight.args = {
  children: (
    <>
      <HoverRevealStack.Item top right>
        <Delete />
      </HoverRevealStack.Item>
      <div style={{ background: 'green', height: '4em' }} />
    </>
  ),
};
