import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { TypePicker } from './TypePicker';
import type { TypePickerProps } from './TypePicker';
import { DataDataContext } from '../..';
import TestContextValue from '../../test/TestContextValue';

export default {
  title: 'Domain/TypePicker',
  component: TypePicker,
  args: {},
};

const Template: Story<TypePickerProps> = (args) => {
  return (
    <DataDataContext.Provider value={new TestContextValue()}>
      <TypePicker {...args} />
    </DataDataContext.Provider>
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
