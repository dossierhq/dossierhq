import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityItemFieldEditor } from './EntityItemFieldEditor';
import type { EntityItemFieldEditorProps } from './EntityItemFieldEditor';
import { createContextValue } from '../../test/TestContextAdapter';
import schema from '../../stories/StoryboardSchema';
import { bar2Id } from '../../test/EntityFixtures';

const meta: Meta<EntityItemFieldEditorProps> = {
  title: 'Domain/EntityItemFieldEditor',
  component: EntityItemFieldEditor,
  args: {
    id: 'id-123',
    value: null,
  },
};
export default meta;

const Template: Story<EntityItemFieldEditorProps> = (args) => {
  return (
    <DataDataContext.Provider value={createContextValue().contextValue}>
      <EntityItemFieldEditor {...args} />
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

function getFieldSpec(entityType: string, fieldName: string) {
  const entitySpec = schema.getEntityTypeSpecification(entityType);
  if (!entitySpec) {
    throw new Error('Entity not available: ' + entityType);
  }
  const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
  if (!fieldSpec) {
    throw new Error(`Field not available ${entityType}/${fieldName}`);
  }
  return fieldSpec;
}
