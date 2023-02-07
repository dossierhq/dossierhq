import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton.js';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: {},
  argTypes: { onClick: { action: 'clicked' } },
  tags: ['autodocs'],
} satisfies Meta<typeof IconButton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { icon: 'add' } };

export const Primary: Story = { args: { icon: 'add', color: 'primary' } };

export const Disabled: Story = { args: { disabled: true, icon: 'add' } };

export const Toggled: Story = { args: { toggled: true, icon: 'add' } };

export const Large: Story = { args: { icon: 'add', size: 'large' } };

export const White: Story = { args: { icon: 'add', color: 'white' } };
