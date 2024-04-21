import type { EntityTypeSpecification, ComponentTypeSpecification } from '@dossierhq/core';
import { NotificationContainer } from '@dossierhq/design';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useContext } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext';
import { useAdminSchema } from '../../hooks/useAdminSchema';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import { SchemaEditorScreen } from './SchemaEditorScreen';

const meta = {
  title: 'Screens/SchemaEditorScreen',
  component: SchemaEditorScreen,
  argTypes: {
    onEditorHasChangesChange: {
      action: 'editor-has-changes',
    },
  },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AdminLoadContextProvider>
        <NotificationContainer>
          <Story />
        </NotificationContainer>
      </AdminLoadContextProvider>
    ),
  ],
} satisfies Meta<typeof SchemaEditorScreen>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const HeaderFooter: Story = {
  args: {
    header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
    footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  },
};

export const SchemaDebug: Story = {
  args: {
    footer: (
      <div style={{ backgroundColor: 'papayawhip' }}>
        <SchemaDebugFooter />
      </div>
    ),
  },
};

function SchemaDebugFooter() {
  const { adminClient } = useContext(AdminDossierContext);
  const { schema } = useAdminSchema(adminClient);

  function typeToString(type: EntityTypeSpecification | ComponentTypeSpecification) {
    return `${type.name} (${type.fields.map((it) => it.name).join(', ')})`;
  }

  return (
    <>
      <p>
        <strong>
          Fetched using <code>useSchema()</code>, i.e. shows how well cache validation works
        </strong>
      </p>
      <p>Entity types in schema: {schema?.spec.entityTypes.map(typeToString).join(', ')}</p>
      <p>Component types in schema: {schema?.spec.componentTypes.map(typeToString).join(', ')}</p>
    </>
  );
}
