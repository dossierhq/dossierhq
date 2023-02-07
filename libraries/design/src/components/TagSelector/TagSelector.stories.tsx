import type { Meta, Story } from '@storybook/react/types-6-0.js';
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

const meta: Meta<StoryProps> = {
  title: 'Components/TagSelector',
  component: TagSelector,
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
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return <Wrapper {...args} />;
};

function Wrapper({ initialState, ...args }: StoryProps) {
  const [state, dispatch] = useReducer<
    MultipleSelectorReducer<StoryItem>,
    MultipleSelectorStateInitializerArgs<StoryItem>
  >(reduceMultipleSelectorState, initialState, initializeMultipleSelectorState);
  return <TagSelector dispatch={dispatch} state={state} {...args} />;
}

export const Normal = Template.bind({});
Normal.args = {};

export const NoSelection = Template.bind({});
NoSelection.args = {
  initialState: { items: [{ id: 'one', name: 'One' }], selectedIds: [] },
};
