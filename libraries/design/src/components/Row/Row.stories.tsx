import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { RowProps } from './Row.js';
import { Row } from './Row.js';

const meta: Meta<RowProps> = {
  title: 'Components/Row',
  component: Row,
  tags: ['autodocs'],
};
export default meta;

const Template: Story<RowProps> = (args) => {
  return <Row {...args} />;
};

export const TwoItemsWithGap = Template.bind({});
TwoItemsWithGap.args = {
  gap: 3,
  children: (
    <>
      <Row.Item style={{ background: 'green', width: '1em', height: '1em' }} />
      <Row.Item style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};

export const ThreeItems = Template.bind({});
ThreeItems.args = {
  children: (
    <>
      <Row.Item style={{ background: 'green', width: '1em', height: '1em' }} />
      <Row.Item style={{ width: '1em', height: '1em' }} />
      <Row.Item style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};
