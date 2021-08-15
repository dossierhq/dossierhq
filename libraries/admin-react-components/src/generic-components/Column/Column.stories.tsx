import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { ColumnProps } from '../..';
import { Column, ColumnElement, ColumnItem, Row, RowElement } from '../..';

const meta: Meta<ColumnProps> = {
  title: 'Generic/Column',
  component: Column,
};
export default meta;

const Template: Story<ColumnProps> = (args) => {
  return <Column {...args} />;
};

export const TwoRowsWithGap = Template.bind({});
TwoRowsWithGap.args = {
  gap: 3,
  children: (
    <>
      <ColumnElement style={{ background: 'green', width: '1em', height: '1em' }} />
      <ColumnElement style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};

export const ThreeRows = Template.bind({});
ThreeRows.args = {
  children: (
    <>
      <ColumnElement style={{ background: 'green', width: '1em', height: '1em' }} />
      <ColumnItem
        grow
        className="has-background bg-danger"
        style={{ width: '1em', height: '1em' }}
      />
      <ColumnElement style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};

export const TwoRowsWithRows = Template.bind({});
TwoRowsWithRows.args = {
  gap: 3,
  children: (
    <>
      <ColumnItem as={Row}>
        <RowElement style={{ background: 'green', width: '1em', height: '1em' }} />
        <RowElement style={{ background: 'violet', width: '1em', height: '1em' }} />
      </ColumnItem>
      <ColumnElement style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};

export const OverflowScrollMiddleRow = Template.bind({});
OverflowScrollMiddleRow.args = {
  className: 'h-100',
  children: (
    <>
      <ColumnElement style={{ background: 'green', width: '1em', height: '1em' }} />
      <ColumnItem grow height={0} overflowY="scroll">
        <RowElement style={{ background: 'red', width: '1em', height: '1em' }} />
        <RowElement style={{ background: 'violet', width: '1em', height: '1em' }} />
      </ColumnItem>
      <ColumnElement style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};
OverflowScrollMiddleRow.decorators = [
  (Story) => (
    <div style={{ height: '3em' }}>
      <Story />
    </div>
  ),
];
