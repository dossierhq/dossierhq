import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityListScreen } from './EntityListScreen';
import type { EntityListScreenProps } from './EntityListScreen';
import { createContextValue } from '../../test/TestContextAdapter';

const meta: Meta<EntityListScreenProps> = {
  title: 'Screens/EntityListScreen',
  component: EntityListScreen,
  argTypes: {
    onCreateEntity: { action: 'create-entity' },
    onOpenEntity: { action: 'open-entity' },
  },
  args: {},
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<EntityListScreenProps> = (args) => {
  return (
    <DataDataContext.Provider value={createContextValue().contextValue}>
      <EntityListScreen {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});

export const HeaderFooter = Template.bind({});
HeaderFooter.args = {
  header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
};
