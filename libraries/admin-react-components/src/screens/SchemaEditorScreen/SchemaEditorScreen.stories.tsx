import type {
  AdminEntityTypeSpecification,
  AdminValueTypeSpecification,
} from '@jonasb/datadata-core';
import { NotificationContainer } from '@jonasb/datadata-design';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useContext } from 'react';
import { DataDataContext2 } from '../../contexts/DataDataContext2';
import { useSchema } from '../../hooks/useSchema';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import type { SchemaEditorScreenProps } from './SchemaEditorScreen';
import { SchemaEditorScreen } from './SchemaEditorScreen';

type StoryProps = SchemaEditorScreenProps;

const meta: Meta<StoryProps> = {
  title: 'Screens/SchemaEditorScreen',
  component: SchemaEditorScreen,
  argTypes: {},
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper(props: StoryProps) {
  return (
    <LoadContextProvider>
      <NotificationContainer>
        <SchemaEditorScreen {...props} />
      </NotificationContainer>
    </LoadContextProvider>
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
  const { adminClient } = useContext(DataDataContext2);
  const { schema } = useSchema(adminClient);

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
