import type { Meta, StoryObj } from '@storybook/react';
import React, { useReducer } from 'react';
import type {
  MultipleSelectorReducer,
  MultipleSelectorStateInitializerArgs,
} from '../DropdownSelector/MultipleSelectorReducer.js';
import {
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
} from '../DropdownSelector/MultipleSelectorReducer.js';
import type { TagProps } from '../Tag/Tag.js';
import type { TagSelectorProps } from './TagSelector.js';
import { TagSelector } from './TagSelector.js';

interface StoryItem {
  id: string;
  name: string;
  color?: TagProps['color'];
}

type StoryProps = Omit<TagSelectorProps<StoryItem>, 'state' | 'dispatch'> & {
  initialState: MultipleSelectorStateInitializerArgs<StoryItem>;
};

const meta = {
  title: 'Components/TagSelector',
  component: Wrapper,
  args: {
    clearLabel: 'Clear',
    initialState: {
      items: [
        { id: 'one', name: 'One' },
        { id: 'two', name: 'Two' },
        { id: 'three', name: 'Three' },
      ],
      selectedIds: ['one', 'two', 'three'],
    },
    itemTag: (item) => ({ tag: item.name, color: item.color }),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

function Wrapper({ initialState, ...args }: StoryProps) {
  const [state, dispatch] = useReducer<
    MultipleSelectorReducer<StoryItem>,
    MultipleSelectorStateInitializerArgs<StoryItem>
  >(reduceMultipleSelectorState, initialState, initializeMultipleSelectorState);
  return <TagSelector dispatch={dispatch} state={state} {...args} />;
}

export const Normal: Story = {};

export const NoSelection: Story = {
  args: {
    initialState: { items: [{ id: 'one', name: 'One' }], selectedIds: [] },
  },
};
