import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useReducer } from 'react';
import type { DropdownSelectorProps } from './DropdownSelector';
import { DropdownSelector } from './DropdownSelector';
import type {
  MultipleSelectorReducer,
  MultipleSelectorStateInitializerArgs,
} from './MultipleSelectorReducer';
import {
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
} from './MultipleSelectorReducer';

interface StoryItem {
  id: string;
  name: string;
}

type StoryProps = Omit<DropdownSelectorProps<StoryItem>, 'state' | 'dispatch'> & {
  initialState: MultipleSelectorStateInitializerArgs<StoryItem>;
};

const meta: Meta<StoryProps> = {
  title: 'Components/DropdownSelector',
  component: DropdownSelector,
  args: {
    label: 'Select',
    renderItem: (item) => item.name,
  },
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
  return <DropdownSelector dispatch={dispatch} state={state} {...args} />;
}

export const Normal = Template.bind({});
Normal.args = {
  initialState: {
    items: [
      { id: 'one', name: 'One' },
      { id: 'two', name: 'Two' },
      { id: 'three', name: 'Three' },
    ],
  },
};
