import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import type { TypePickerProps } from './TypePicker';
import { TypePicker } from './TypePicker';

const meta: Meta<TypePickerProps> = {
  title: 'Domain/TypePicker',
  component: TypePicker,
  args: { id: 'type-picker' },
};
export default meta;

const Template: Story<TypePickerProps> = (args) => {
  return (
    <LoadContextProvider>
      <TypePicker {...args} />
    </LoadContextProvider>
  );
};

export const EntityTypes = Template.bind({});
EntityTypes.args = { text: 'Select entity type', showEntityTypes: true };

export const EntityTypesFiltered = Template.bind({});
EntityTypesFiltered.args = {
  text: 'Select entity type',
  showEntityTypes: true,
  entityTypes: ['Bar'],
};

export const ValueTypes = Template.bind({});
ValueTypes.args = { text: 'Select value type', showValueTypes: true };

export const ValueTypesFiltered = Template.bind({});
ValueTypesFiltered.args = {
  text: 'Select value type',
  showValueTypes: true,
  valueTypes: ['NestedValueItem'],
};
