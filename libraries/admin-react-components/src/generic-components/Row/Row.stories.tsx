import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { RowProps } from '../..';
import { Column, ColumnElement, Row, RowElement, RowItem } from '../..';

const meta: Meta<RowProps> = {
  title: 'Generic/Row',
  component: Row,
};
export default meta;

const Template: Story<RowProps> = (args) => {
  return <Row {...args} />;
};

export const TwoColumnsWithGap = Template.bind({});
TwoColumnsWithGap.args = {
  gap: 3,
  children: (
    <>
      <RowElement style={{ background: 'green', width: '1em', height: '1em' }} />
      <RowElement style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};

export const ThreeColumns = Template.bind({});
ThreeColumns.args = {
  children: (
    <>
      <RowElement style={{ background: 'green', width: '1em', height: '1em' }} />
      <RowItem
        grow
        className="dd-has-background dd-bg-danger"
        style={{ width: '1em', height: '1em' }}
      />
      <RowElement style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};

export const TwoColumnsWithColumns = Template.bind({});
TwoColumnsWithColumns.args = {
  children: (
    <>
      <RowItem as={Column}>
        <ColumnElement style={{ background: 'green', width: '1em', height: '1em' }} />
        <ColumnElement style={{ background: 'blue', width: '1em', height: '1em' }} />
      </RowItem>
      <RowElement style={{ background: 'red', width: '1em', height: '1em' }} />
    </>
  ),
};
