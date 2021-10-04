import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { LoadContextProvider } from '../../test/LoadContextProvider.js';
import type { TypePicker2Props } from './TypePicker2.js';
import { TypePicker2 } from './TypePicker2.js';

const meta: Meta<TypePicker2Props> = {
  title: 'Components/TypePicker2',
  component: TypePicker2,
  args: {},
  argTypes: {
    onTypeSelected: { action: 'type-selected' },
  },
};
export default meta;

const Template: Story<TypePicker2Props> = (args) => {
  return (
    <LoadContextProvider>
      <TypePicker2 {...args} />
    </LoadContextProvider>
  );
};

export const EntityTypes = Template.bind({});
EntityTypes.args = { children: 'Select entity type', showEntityTypes: true };

export const EntityTypesFiltered = Template.bind({});
EntityTypesFiltered.args = {
  children: 'Select entity type',
  showEntityTypes: true,
  entityTypes: ['Bar'],
};

export const ValueTypes = Template.bind({});
ValueTypes.args = { children: 'Select value type', showValueTypes: true };

export const ValueTypesFiltered = Template.bind({});
ValueTypesFiltered.args = {
  children: 'Select value type',
  showValueTypes: true,
  valueTypes: ['NestedValueItem'],
};
