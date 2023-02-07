import type { Meta, StoryObj } from '@storybook/react';
import { File } from './File.js';

const meta = {
  title: 'Components/File',
  component: File,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof File>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Boxed: Story = { args: { boxed: true } };

export const Accept: Story = { args: { accept: 'image/png, .png' } };
