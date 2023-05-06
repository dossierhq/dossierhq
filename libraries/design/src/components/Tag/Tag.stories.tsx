import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Tag } from './Tag.js';

const meta = {
  title: 'Components/Tag',
  component: Tag,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof Tag>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { children: 'tag' } };

export const Remove: Story = { args: { children: ['tag', <Tag.Remove key="1" />] } };

export const Published: Story = { args: { children: 'published', color: 'published' } };

export const PublishedRemove: Story = {
  args: { color: 'published', children: ['tag', <Tag.Remove key="1" />] },
};

export const NoTransform: Story = { args: { children: 'lowercase tag', transform: '' } };
