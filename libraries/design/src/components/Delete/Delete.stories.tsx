import type { Meta, StoryObj } from '@storybook/react';
import { Delete } from './Delete.js';

const meta = {
  title: 'Components/Delete',
  component: Delete,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof Delete>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
