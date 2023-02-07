import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { EmptyStateMessageProps } from './EmptyStateMessage.js';
import { EmptyStateMessage } from './EmptyStateMessage.js';

type StoryProps = EmptyStateMessageProps;

const meta: Meta<StoryProps> = {
  title: 'Components/EmptyStateMessage',
  component: EmptyStateMessage,
  args: { icon: 'add', title: 'Title', message: 'Message' },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = (args: StoryProps) => {
  return (
    <div style={{ height: '100vh' }}>
      <EmptyStateMessage {...args} />
    </div>
  );
};

export const Normal = Template.bind({});

export const LongMessage = Template.bind({});
LongMessage.args = {
  message:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
};
