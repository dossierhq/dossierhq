import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { ColumnProps } from './Column';
import { Column, ColumnElement, ColumnItem } from './Column';

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
