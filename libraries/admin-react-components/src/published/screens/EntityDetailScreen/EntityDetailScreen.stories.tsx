import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { foo1Id } from '../../../test/EntityFixtures';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import type { EntityDetailScreenProps } from './EntityDetailScreen';
import { EntityDetailScreen } from './EntityDetailScreen';

type StoryProps = EntityDetailScreenProps;

const meta: Meta<EntityDetailScreenProps> = {
  title: 'Published/Screens/EntityDetailScreen',
  component: EntityDetailScreen,
  argTypes: {},
  args: { reference: { id: foo1Id } },
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper(props: StoryProps) {
  return (
    <LoadContextProvider>
      <EntityDetailScreen {...props} />
    </LoadContextProvider>
  );
}

export const Normal = Template.bind({});

export const HeaderFooter = Template.bind({});
HeaderFooter.args = {
  header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
};
