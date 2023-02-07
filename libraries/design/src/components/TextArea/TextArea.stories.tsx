import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from './TextArea.js';

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  args: { defaultValue: 'Hello world' },
  tags: ['autodocs'],
} satisfies Meta<typeof TextArea>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const ReadOnly: Story = { args: { readOnly: true } };

export const CodeTextStyle: Story = { args: { textStyle: 'code2' } };

export const FixedSize: Story = { args: { fixedSize: true } };
