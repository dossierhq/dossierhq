import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React, { useReducer } from 'react';
import type { DropdownSelector2Props } from './DropdownSelector2.js';
import { DropdownSelector2 } from './DropdownSelector2.js';
import type {
  MultipleSelectorReducer,
  MultipleSelectorStateInitializerArgs,
} from '../DropdownSelector/MultipleSelectorReducer.js';
import {
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
} from '../DropdownSelector/MultipleSelectorReducer.js';

interface StoryItem {
  id: string;
  name: string;
}

type StoryProps = Omit<DropdownSelector2Props<StoryItem>, 'state' | 'dispatch'> & {
  initialState: MultipleSelectorStateInitializerArgs<StoryItem>;
};

const meta: Meta<StoryProps> = {
  title: 'Components/DropdownSelector2',
  component: DropdownSelector2,
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
  return <DropdownSelector2 dispatch={dispatch} state={state} {...args} />;
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
