import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { Table } from '../Table/Table.js';
import type { ScrollableProps } from './Scrollable.js';
import { Scrollable } from './Scrollable.js';

type StoryProps = ScrollableProps;

const meta: Meta<StoryProps> = {
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
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <Scrollable {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <div
      style={{
        background:
          'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
        height: '300vh',
      }}
    />
  ),
};

export const Horizontal = Template.bind({});
Horizontal.args = {
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
};

export const ShadowsNone = Template.bind({});
ShadowsNone.args = {
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
};

export const ShadowsBottom = Template.bind({});
ShadowsBottom.args = {
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
};

export const NoScroll = Template.bind({});
NoScroll.args = {
  children: (
    <div
      style={{
        background:
          'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
        height: '30vh',
      }}
    />
  ),
};

export const StickyTableHeader = Template.bind({});
StickyTableHeader.args = {
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
};
