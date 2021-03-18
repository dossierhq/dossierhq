import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { RowProps } from './Row';
import { Row } from './Row';

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
      <Row.Column>
        <div style={{ background: 'green', width: '1em', height: '1em' }} />
      </Row.Column>
      <Row.Column>
        <div style={{ background: 'blue', width: '1em', height: '1em' }} />
      </Row.Column>
    </>
  ),
};

export const ThreeColumns = Template.bind({});
ThreeColumns.args = {
  children: (
    <>
      <Row.Column>
        <div style={{ background: 'green', width: '1em', height: '1em' }} />
      </Row.Column>
      <Row.Column grow className="has-background bg-danger">
        <div style={{ background: 'yellow', width: '1em', height: '1em' }} />
      </Row.Column>
      <Row.Column>
        <div style={{ background: 'blue', width: '1em', height: '1em' }} />
      </Row.Column>
    </>
  ),
};
