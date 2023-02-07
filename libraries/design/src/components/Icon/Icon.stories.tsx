import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Icon } from './Icon.js';

const meta = {
  title: 'Components/Icon',
  component: Icon,
  args: { icon: 'list' },
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#1111' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Icon>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { icon: 'chevronDown' } };

export const Empty: Story = { args: { icon: null } };

export const TextIcon: Story = {
  decorators: [
    (Story) => (
      <p>
        Icon in
        <Story />
        text
      </p>
    ),
  ],
  args: { icon: 'map', text: true },
};

export const SizeLarge: Story = { args: { size: 'large' } };
