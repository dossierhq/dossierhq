import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '../Button/Button.js';
import { ButtonGroup } from './ButtonGroup.js';

const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonGroup>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: (
      <>
        <Button>Foo</Button>
        <Button>Bar</Button>
      </>
    ),
  },
};

export const Centered: Story = {
  args: {
    centered: true,
    children: (
      <>
        <Button>Foo</Button>
        <Button>Bar</Button>
      </>
    ),
  },
};

export const HasAddons: Story = {
  args: {
    hasAddons: true,
    children: (
      <>
        <Button>Foo</Button>
        <Button>Bar</Button>
      </>
    ),
  },
};
