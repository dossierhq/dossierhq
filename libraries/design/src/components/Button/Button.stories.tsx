import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Badge } from '../Badge/Badge.js';
import { Button } from './Button.js';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Button' },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: {} };

export const Primary: Story = { args: { color: 'primary' } };

export const Disabled: Story = { args: { disabled: true } };

export const Title: Story = { args: { title: 'Button title' } };

export const LeftIcon: Story = { args: { iconLeft: 'add' } };

export const RightIconOnly: Story = { args: { iconRight: 'chevronDown', children: undefined } };

export const WithBadge: Story = {
  args: {
    children: (
      <>
        Badge<Badge>123</Badge>
      </>
    ),
  },
};

export const Light: Story = { args: { color: 'light' } };

export const Anchor: Story = { args: { as: 'a', href: 'javascript: alert("Clicked")' } };
