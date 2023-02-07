import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { EmptyStateMessage } from './EmptyStateMessage.js';

const meta = {
  title: 'Components/EmptyStateMessage',
  component: EmptyStateMessage,
  args: { icon: 'add', title: 'Title', message: 'Message' },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyStateMessage>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const LongMessage: Story = {
  args: {
    message:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
};
