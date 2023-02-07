import type { Meta, Story } from '@storybook/react/types-6-0.js';
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

const meta: Meta<StoryProps> = {
  title: 'Components/DropdownSelector',
  component: DropdownSelector,
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
Normal.args = {};

export const IconOnly = Template.bind({});
IconOnly.args = {
  iconLeft: 'add',
  children: undefined,
};

export const IconText = Template.bind({});
IconText.args = {
  iconLeft: 'add',
};

export const Left = Template.bind({});
Left.args = { left: true };

export const Up = Template.bind({});
Up.args = { up: true };

export const UpLeft = Template.bind({});
UpLeft.args = { up: true, left: true };

export const Sneaky = Template.bind({});
Sneaky.args = { sneaky: true };
