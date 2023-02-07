import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Message } from './Message.js';

const meta = {
  title: 'Components/Message',
  component: Message,
  args: {
    children: (
      <>
        <Message.Header>
          <Message.HeaderTitle>Header</Message.HeaderTitle>
        </Message.Header>
        <Message.Body>
          Body with <strong>strong</strong> and <i>italic</i>
        </Message.Body>
      </>
    ),
  },
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Message>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const NoHeader: Story = {
  args: {
    children: <Message.Body>Body</Message.Body>,
  },
};

export const Warning: Story = { args: { color: 'warning' } };

export const Danger: Story = { args: { color: 'danger' } };

export const FlexBodyTwoChildren: Story = {
  args: {
    children: (
      <Message.Body>
        <div style={{ width: '100px', height: '100px', backgroundColor: 'palevioletred' }} />
        <div style={{ width: '100px', height: '100px', backgroundColor: 'olivedrab' }} />
      </Message.Body>
    ),
  },
};

export const FlexBodyNoPadding: Story = {
  args: {
    children: (
      <Message.FlexBody padding={0}>
        <div style={{ width: '100px', height: '100px', backgroundColor: 'palevioletred' }} />
        <div style={{ width: '100px', height: '100px', backgroundColor: 'olivedrab' }} />
      </Message.FlexBody>
    ),
  },
};
