import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Badge } from '../Badge/Badge.js';
import { Button2 } from './Button2.js';

const meta = {
  title: 'Components/Button2',
  component: Button2,
  args: { children: 'Button' },
  tags: ['autodocs'],
} satisfies Meta<typeof Button2>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: {} };

export const Primary: Story = { args: { color: 'primary' } };

//TODO support: export const Disabled: Story = { args: { isDisabled: true } };

//TODO support: export const Title: Story = { args: { title: 'Button title' } };

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

//TODO support: export const Anchor: Story = { args: { as: 'a', href: 'javascript: alert("Clicked")' } };
