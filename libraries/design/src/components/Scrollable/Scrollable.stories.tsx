import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Table } from '../Table/Table.js';
import { Scrollable } from './Scrollable.js';

const meta = {
  title: 'Components/Scrollable',
  component: Scrollable,
  decorators: [
    (Story: () => React.ReactElement<unknown>, _context): JSX.Element => (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ height: '50px' }} />
        <Story />
        <div style={{ height: '50px' }} />
      </div>
    ),
  ],
  args: { style: { flexGrow: 1, height: 0 } },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Scrollable>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: (
      <div
        style={{
          background:
            'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
          height: '300vh',
        }}
      />
    ),
  },
};

export const Horizontal: Story = {
  args: {
    direction: 'horizontal',
    children: (
      <div
        style={{
          background:
            'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
          width: '300vw',
          height: '100%',
        }}
      />
    ),
  },
};

export const ShadowsNone: Story = {
  args: {
    shadows: 'none',
    children: (
      <div
        style={{
          background:
            'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
          height: '300vh',
        }}
      />
    ),
  },
};

export const ShadowsBottom: Story = {
  args: {
    shadows: 'bottom',
    children: (
      <div
        style={{
          background:
            'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
          height: '300vh',
        }}
      />
    ),
  },
};

export const NoScroll: Story = {
  args: {
    children: (
      <div
        style={{
          background:
            'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
          height: '30vh',
        }}
      />
    ),
  },
};

export const StickyTableHeader: Story = {
  args: {
    children: (
      <>
        <div
          style={{
            background:
              'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
            height: '30vh',
          }}
        />
        <Table>
          <Table.Head>
            <Table.Row sticky>
              <Table.Header>Hello</Table.Header>
              <Table.Header>World</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Hello</Table.Cell>
              <Table.Cell>World</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        <div
          style={{
            background:
              'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
            height: '120vh',
          }}
        />
      </>
    ),
  },
};
