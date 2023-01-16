import type { AdminEntityTypeSpecification, AdminValueTypeSpecification } from '@dossierhq/core';
import { NotificationContainer } from '@jonasb/datadata-design';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useContext } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { useAdminSchema } from '../../hooks/useAdminSchema';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import type { SchemaEditorScreenProps } from './SchemaEditorScreen';
import { SchemaEditorScreen } from './SchemaEditorScreen';

type StoryProps = SchemaEditorScreenProps;

const meta: Meta<StoryProps> = {
  title: 'Screens/SchemaEditorScreen',
  component: SchemaEditorScreen,
  argTypes: {
    onEditorHasChangesChange: {
      action: 'editor-has-changes',
    },
  },
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper(props: StoryProps) {
  return (
    <AdminLoadContextProvider>
      <NotificationContainer>
        <SchemaEditorScreen {...props} />
      </NotificationContainer>
    </AdminLoadContextProvider>
  );
}

export const Normal = Template.bind({});

export const HeaderFooter = Template.bind({});
HeaderFooter.args = {
  header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
};

export const SchemaDebug = Template.bind({});
SchemaDebug.args = {
  footer: (
    <div style={{ backgroundColor: 'papayawhip' }}>
      <SchemaDebugFooter />
    </div>
  ),
};

function SchemaDebugFooter() {
  const { adminClient } = useContext(AdminDataDataContext);
  const { schema } = useAdminSchema(adminClient);

  function typeToString(type: AdminEntityTypeSpecification | AdminValueTypeSpecification) {
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
      <p>Value types in schema: {schema?.spec.valueTypes.map(typeToString).join(', ')}</p>
    </>
  );
}
