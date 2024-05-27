import type { ComponentTypeSpecification, EntityTypeSpecification } from '@dossierhq/core';
import { NotificationContainer } from '@dossierhq/design';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useContext } from 'react';
import { DossierContext } from '../../contexts/DossierContext';
import { useAdminSchema } from '../../hooks/useAdminSchema';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import { SchemaEditorScreen } from './SchemaEditorScreen';

const meta: Meta<typeof SchemaEditorScreen> = {
  title: 'Screens/SchemaEditorScreen',
  component: SchemaEditorScreen,
  args: { onEditorHasChangesChange: fn() },
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
  const { client } = useContext(DossierContext);
  const { schema } = useAdminSchema(client);

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
