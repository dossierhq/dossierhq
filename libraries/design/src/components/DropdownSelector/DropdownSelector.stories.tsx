import type { Meta, StoryObj } from '@storybook/react';
import React, { useReducer } from 'react';
import type { DropdownSelectorProps } from './DropdownSelector.js';
import { DropdownSelector } from './DropdownSelector.js';
import type {
  MultipleSelectorReducer,
  MultipleSelectorStateInitializerArgs,
} from './MultipleSelectorReducer.js';
import {
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
} from './MultipleSelectorReducer.js';

interface StoryItem {
  id: string;
  name: string;
}

type StoryProps = Omit<DropdownSelectorProps<StoryItem>, 'state' | 'dispatch'> & {
  initialState: MultipleSelectorStateInitializerArgs<StoryItem>;
};

const meta = {
  title: 'Components/DropdownSelector',
  component: Wrapper,
  args: {
    children: 'Select',
    initialState: {
      items: [
        { id: 'one', name: 'One' },
        { id: 'two', name: 'Two' },
        { id: 'three', name: 'Three' },
      ],
    },
    renderItem: (item) => item.name,
  },
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

function Wrapper({ initialState, ...args }: StoryProps) {
  const [state, dispatch] = useReducer<
    MultipleSelectorReducer<StoryItem>,
    MultipleSelectorStateInitializerArgs<StoryItem>
  >(reduceMultipleSelectorState, initialState, initializeMultipleSelectorState);
  return <DropdownSelector dispatch={dispatch} state={state} {...args} />;
}

export const Normal: Story = {};

export const IconOnly: Story = {
  args: {
    iconLeft: 'add',
    children: undefined,
  },
};

export const IconText: Story = { args: { iconLeft: 'add' } };

export const Left: Story = { args: { left: true } };

export const Up: Story = { args: { up: true } };

export const UpLeft: Story = { args: { up: true, left: true } };

export const Sneaky: Story = { args: { sneaky: true } };
