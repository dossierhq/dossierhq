import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { LevelProps } from './Level.js';
import { Level } from './Level.js';

const meta: Meta<LevelProps> = {
  title: 'Components/Level',
  component: Level,
  tags: ['autodocs'],
};
export default meta;

const Template: Story<LevelProps> = (args) => {
  return <Level {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: <Level.Item>Item</Level.Item>,
};

export const Padding = Template.bind({});
Padding.args = {
  padding: 5,
  children: <Level.Item>Item</Level.Item>,
};

export const LeftRight = Template.bind({});
LeftRight.args = {
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
};

export const LeftCenterRight = Template.bind({});
LeftCenterRight.args = {
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
};
