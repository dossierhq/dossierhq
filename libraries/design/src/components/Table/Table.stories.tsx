import type { Meta, Story } from '@storybook/react/types-6-0.js';
import type { MouseEvent } from 'react';
import React, { useState } from 'react';
import type { TableProps } from './Table.js';
import { Table } from './Table.js';

type ColumnName = 'one' | 'two' | 'three';
export interface StoryProps extends TableProps {
  rowCount: number;
  stickyHeader: boolean;
  orderableHeaders: ColumnName[];
  onHeaderClick: (event: MouseEvent) => void;
  onRowClick: (event: MouseEvent) => void;
}

const meta: Meta<StoryProps> = {
  title: 'Components/Table',
  component: Table,
  args: { orderableHeaders: [], rowCount: 50 },
  argTypes: { onHeaderClick: { action: 'clicked' }, onRowClick: { action: 'clicked' } },
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return <Wrapper {...args} />;
};

function Wrapper({
  orderableHeaders,
  rowCount,
  stickyHeader,
  onHeaderClick,
  onRowClick,
}: StoryProps) {
  const [activeOrder, setActiveOrder] = useState(orderableHeaders[0] ?? null);
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('asc');

  const orderForColumn = (column: ColumnName) => {
    const isOrderable = orderableHeaders.includes(column);
    if (!isOrderable) return undefined;
    return column === activeOrder ? orderDirection : '';
  };

  const onClickHandlerForColumn = (column: ColumnName) => {
    const isOrderable = orderableHeaders.includes(column);
    if (isOrderable) {
      return (event: MouseEvent) => {
        if (activeOrder !== column) {
          setActiveOrder(column);
        } else {
          setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
        }
        onHeaderClick(event);
      };
    }
    return onHeaderClick;
  };

  return (
    <Table hoverable>
      <Table.Head>
        <Table.Row sticky={stickyHeader}>
          <Table.Header order={orderForColumn('one')} onClick={onClickHandlerForColumn('one')}>
            One
          </Table.Header>
          <Table.Header order={orderForColumn('two')} onClick={onClickHandlerForColumn('two')}>
            Two
          </Table.Header>
          <Table.Header
            narrow
            order={orderForColumn('three')}
            onClick={onClickHandlerForColumn('three')}
          >
            Three
          </Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {[...Array(rowCount).keys()].map((_, index) => (
          <Table.Row key={index} clickable onClick={onRowClick}>
            <Table.Cell>Row {index + 1}</Table.Cell>
            <Table.Cell>Two</Table.Cell>
            <Table.Cell narrow>Three</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export const Normal = Template.bind({});
Normal.args = {};

export const Empty = Template.bind({});
Empty.args = { rowCount: 0 };

export const StickyHeader = Template.bind({});
StickyHeader.args = { stickyHeader: true };

export const Orderable = Template.bind({});
Orderable.args = {
  orderableHeaders: ['one', 'two'],
};
