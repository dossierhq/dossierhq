import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { TypePicker } from './TypePicker';
import type { TypePickerProps } from './TypePicker';
import schema from '../../stories/StoryboardSchema';

export default {
  title: 'Domain/TypePicker',
  component: TypePicker,
  args: { schema },
};

const Template: Story<TypePickerProps> = (args) => {
  return <TypePicker {...args} />;
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
