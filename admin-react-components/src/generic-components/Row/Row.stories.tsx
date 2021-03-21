import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { RowProps } from './Row';
import { Row, RowElement, RowItem } from './Row';

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
      <RowItem grow className="has-background bg-danger" style={{ width: '1em', height: '1em' }} />
      <RowElement style={{ background: 'blue', width: '1em', height: '1em' }} />
    </>
  ),
};
