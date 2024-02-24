import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input.js';

const meta = {
  title: 'Components/Input',
  component: Input,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Placeholder: Story = { args: { placeholder: 'Placeholder' } };

export const ReadOnly: Story = { args: { value: 'Read only', readOnly: true } };

export const LeftIcon: Story = { args: { iconLeft: 'map' } };

export const NumberType: Story = { args: { type: 'number', min: 0, max: 100, step: 1 } };

export const CodeTextStyle: Story = { args: { textStyle: 'code1' } };

export const ClickToEdit: Story = {
  args: {
    value: 'Initial value',
    readOnly: true,
    onClick: (event) => {
      const newValue = window.prompt('Enter value', event.currentTarget.value);
      if (newValue !== null) {
        event.currentTarget.value = newValue ?? '';
      }
    },
  },
};
