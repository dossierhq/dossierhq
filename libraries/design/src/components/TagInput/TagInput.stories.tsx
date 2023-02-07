import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Tag } from '../Tag/Tag';
import { TagInput } from './TagInput';

const meta = {
  title: 'Components/TagInput',
  component: TagInput,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof TagInput>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: (
      <>
        <Tag color="archived">
          One
          <Tag.Remove />
        </Tag>
        <Tag color="archived">Two</Tag>
        <Tag color="archived">Three</Tag>
      </>
    ),
  },
};

export const Empty: Story = { args: { children: null } };

export const TwentyTags: Story = {
  args: {
    children: [...Array(20).keys()].map((it) => <Tag key={it}>{`Tag ${it}`}</Tag>),
  },
};
