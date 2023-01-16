import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import type { AdminTypePickerProps } from './AdminTypePicker';
import { AdminTypePicker } from './AdminTypePicker';

const meta: Meta<AdminTypePickerProps> = {
  title: 'Components/AdminTypePicker',
  component: AdminTypePicker,
  args: {},
  argTypes: {
    onTypeSelected: { action: 'type-selected' },
  },
};
export default meta;

const Template: Story<AdminTypePickerProps> = (args) => {
  return (
    <AdminLoadContextProvider>
      <AdminTypePicker {...args} />
    </AdminLoadContextProvider>
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
