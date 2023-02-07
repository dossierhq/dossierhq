import type { Meta, StoryObj } from '@storybook/react';
import { ButtonDropdown } from './ButtonDropdown.js';

interface StoryItem {
  id: string;
  name: string;
}

const meta = {
  title: 'Components/ButtonDropdown',
  component: ButtonDropdown,
  args: {
    children: 'Select',
    items: [
      { id: 'one', name: 'One' },
      { id: 'two', name: 'Two' },
      { id: 'three', name: 'Three' },
    ],
    renderItem: (item) => item.name,
  },
  argTypes: { onItemClick: { action: 'clicked' } },
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonDropdown<StoryItem>>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const ActiveItem: Story = { args: { activeItemIds: ['two'] } };

export const IconOnly: Story = {
  args: {
    iconLeft: 'add',
    children: undefined,
  },
};

export const IconText: Story = {
  args: {
    iconLeft: 'add',
  },
};

export const Left: Story = { args: { left: true } };

export const Up: Story = { args: { up: true } };

export const UpLeft: Story = { args: { up: true, left: true } };

export const Sneaky: Story = { args: { sneaky: true } };

export const Empty: Story = { args: { children: undefined } };
