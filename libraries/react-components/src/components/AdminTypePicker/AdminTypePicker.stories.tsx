import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import { AdminTypePicker } from './AdminTypePicker';

const meta = {
  title: 'Components/AdminTypePicker',
  component: AdminTypePicker,
  args: {},
  argTypes: {
    onTypeSelected: { action: 'type-selected' },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AdminLoadContextProvider>
        <Story />
      </AdminLoadContextProvider>
    ),
  ],
} satisfies Meta<typeof AdminTypePicker>;
export default meta;

type Story = StoryObj<typeof meta>;

export const EntityTypes: Story = {
  args: { children: 'Select entity type', showEntityTypes: true },
};

export const EntityTypesFiltered: Story = {
  args: {
    children: 'Select entity type',
    showEntityTypes: true,
    entityTypes: ['Bar'],
  },
};

export const ValueTypes: Story = {
  args: { children: 'Select component type', showValueTypes: true },
};

export const ValueTypesFiltered: Story = {
  args: {
    children: 'Select component type',
    showValueTypes: true,
    valueTypes: ['NestedValueItem'],
  },
};
