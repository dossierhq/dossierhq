import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { ColumnProps } from './Column.js';
import { Column } from './Column.js';

const meta: Meta<ColumnProps> = {
  title: 'Components/Column',
  component: Column,
  tags: ['autodocs'],
};
export default meta;

const Template: Story<ColumnProps> = (args) => {
  return <Column {...args} />;
};

export const TwoItemsWithGap = Template.bind({});
TwoItemsWithGap.args = {
  gap: 3,
  children: (
    <>
      <Column.Item style={{ background: 'green', width: '1em', height: '1em' }} />
      <Column.Item style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};

export const ThreeItems = Template.bind({});
ThreeItems.args = {
  children: (
    <>
      <Column.Item style={{ background: 'green', width: '1em', height: '1em' }} />
      <Column.Item style={{ width: '1em', height: '1em' }} />
      <Column.Item style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};
