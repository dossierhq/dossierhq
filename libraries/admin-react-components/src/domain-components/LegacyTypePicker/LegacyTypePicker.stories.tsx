import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import type { LegacyTypePickerProps } from './LegacyTypePicker';
import { LegacyTypePicker } from './LegacyTypePicker';

const meta: Meta<LegacyTypePickerProps> = {
  title: 'Domain/LegacyTypePicker',
  component: LegacyTypePicker,
};
export default meta;

const Template: Story<LegacyTypePickerProps> = (args) => {
  return (
    <AdminLoadContextProvider>
      <LegacyTypePicker {...args} />
    </AdminLoadContextProvider>
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
