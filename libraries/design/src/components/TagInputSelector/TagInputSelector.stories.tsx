import type { Meta, StoryObj } from '@storybook/react';
import React, { useReducer } from 'react';
import {
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
  type MultipleSelectorReducer,
  type MultipleSelectorStateInitializerArgs,
} from '../DropdownSelector/MultipleSelectorReducer.js';
import type { TagProps } from '../Tag/Tag.js';
import { TagInputSelector, type TagInputSelectorProps } from './TagInputSelector.js';

interface StoryItem {
  id: string;
  name: string;
  color?: TagProps['color'];
  removable?: boolean;
}

type StoryProps = Omit<TagInputSelectorProps<StoryItem>, 'state' | 'dispatch'> & {
  initialState: MultipleSelectorStateInitializerArgs<StoryItem>;
};

const meta = {
  title: 'Components/TagInputSelector',
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
    itemTag: (item) => ({ tag: item.name, color: item.color, removable: item.removable }),
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
  return <TagInputSelector dispatch={dispatch} state={state} {...args} />;
}

export const Normal: Story = {};

export const NoSelection: Story = {
  args: {
    initialState: { items: [{ id: 'one', name: 'One' }], selectedIds: [] },
  },
};

export const NonRemovableSelection: Story = {
  args: {
    initialState: {
      items: [
        { id: 'non-removable', name: 'Non-removable', removable: false },
        { id: 'one', name: 'One' },
      ],
      selectedIds: ['non-removable', 'one'],
    },
  },
};
