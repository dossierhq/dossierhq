import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityPicker } from './EntityPicker';
import type { EntityPickerProps } from './EntityPicker';
import { createContextValue } from '../../test/TestContextAdapter';
import schema from '../../stories/StoryboardSchema';
import { bar2Id } from '../../test/EntityFixtures';

const defaultArgs: Partial<EntityPickerProps> = {
  id: 'id-123',
  value: null,
  schema,
};

function getFieldSpec(entityType: string, fieldName: string) {
  const entitySpec = schema.getEntityTypeSpecification('Foo');
  if (!entitySpec) {
    throw new Error('Entity not available: ' + entityType);
  }
  const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
  if (!fieldSpec) {
    throw new Error(`Field not available ${entityType}/${fieldName}`);
  }
  return fieldSpec;
}

export default {
  title: 'Domain/EntityPicker',
  component: EntityPicker,
  args: defaultArgs,
};

const Template: Story<EntityPickerProps> = (args) => {
  return (
    <DataDataContext.Provider value={createContextValue()}>
      <EntityPicker {...args} />
    </DataDataContext.Provider>
  );
};

export const NormalBar = Template.bind({});
NormalBar.args = {
  fieldSpec: getFieldSpec('Foo', 'bar'),
};

export const InitialBar = Template.bind({});
InitialBar.args = {
  fieldSpec: getFieldSpec('Foo', 'bar'),
  value: { id: bar2Id },
};
