import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Text } from './Text.js';

const meta = {
  title: 'Components/Text',
  component: Text,
  args: { children: 'Lorem ipsum', textStyle: 'body1' },
  tags: ['autodocs'],
} satisfies Meta<typeof Text>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const WithNestedSpan: Story = {
  args: {
    children: (
      <>
        Hello{' '}
        <Text as="span" textStyle="body2">
          World
        </Text>
        !
      </>
    ),
  },
};

export const Danger: Story = { args: { color: 'danger' } };
