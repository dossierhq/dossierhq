import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Tag } from './Tag.js';

const meta = {
  title: 'Components/Tag.Group',
  component: Tag.Group,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof Tag.Group>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: [<Tag key="0">One</Tag>, <Tag key="1">Two</Tag>],
  },
};

export const Remove: Story = {
  args: {
    children: [
      <Tag key="0">
        One
        <Tag.Remove />
      </Tag>,
      <Tag key="1">
        Two
        <Tag.Remove />
      </Tag>,
    ],
  },
};

export const RemoveClear: Story = {
  args: {
    children: [
      <Tag key="0">
        One
        <Tag.Remove />
      </Tag>,
      <Tag key="1">
        Two
        <Tag.Remove />
      </Tag>,
      <Tag.Clear key="2">Clear</Tag.Clear>,
    ],
  },
};

export const Status: Story = {
  args: {
    children: [
      <Tag key="0" color="draft">
        Draft
      </Tag>,
      <Tag key="1" color="published">
        Published
      </Tag>,
      <Tag key="2" color="modified">
        Modified
      </Tag>,
      <Tag key="3" color="withdrawn">
        Withdrawn
      </Tag>,
      <Tag key="4" color="archived">
        Archived
      </Tag>,
    ],
  },
};

export const TwentyAndClear: Story = {
  args: {
    children: [
      ...[...Array(20).keys()].map((it) => <Tag key={it}>{`Tag ${it}`}</Tag>),
      <Tag.Clear key="clear">Clear</Tag.Clear>,
    ],
  },
};
