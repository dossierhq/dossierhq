import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import schema from '../../stories/StoryboardSchema.js';
import { bar2Id } from '../../test/EntityFixtures.js';
import { LoadContextProvider } from '../../test/LoadContextProvider.js';
import { LoadFixtures } from '../../test/LoadFixtures.js';
import type { EntityItemFieldEditorProps } from './EntityItemFieldEditor.js';
import { EntityItemFieldEditor } from './EntityItemFieldEditor.js';

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
    <LoadContextProvider>
      <LoadFixtures>
        <EntityItemFieldEditor {...args} />
      </LoadFixtures>
    </LoadContextProvider>
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
