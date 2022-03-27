import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
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
      <SchemaEditorScreen {...props} />
    </LoadContextProvider>
  );
}

export const Normal = Template.bind({});

export const HeaderFooter = Template.bind({});
HeaderFooter.args = {
  header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
};
