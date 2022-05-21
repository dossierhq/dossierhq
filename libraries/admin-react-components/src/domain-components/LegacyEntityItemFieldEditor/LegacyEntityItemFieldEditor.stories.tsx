import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import schema from '../../stories/StoryboardSchema';
import { bar2Id } from '../../test/EntityFixtures';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import { LoadFixtures } from '../../test/LoadFixtures';
import type { LegacyEntityItemFieldEditorProps } from './LegacyEntityItemFieldEditor';
import { LegacyEntityItemFieldEditor } from './LegacyEntityItemFieldEditor';

const meta: Meta<LegacyEntityItemFieldEditorProps> = {
  title: 'Domain/LegacyEntityItemFieldEditor',
  component: LegacyEntityItemFieldEditor,
  args: {
    id: 'id-123',
    value: null,
  },
};
export default meta;

const Template: Story<LegacyEntityItemFieldEditorProps> = (args) => {
  return (
    <AdminLoadContextProvider>
      <LoadFixtures>
        <LegacyEntityItemFieldEditor {...args} />
      </LoadFixtures>
    </AdminLoadContextProvider>
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
