import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityEditorContainer } from './EntityEditorContainer';
import type { EntityEditorContainerProps } from './EntityEditorContainer';
import { createContextValue } from '../../test/TestContextAdapter';
import { foo1Id } from '../../test/EntityFixtures';

const meta: Meta<EntityEditorContainerProps> = {
  title: 'Domain/EntityEditorContainer',
  component: EntityEditorContainer,
  args: {},
};
export default meta;

const Template: Story<EntityEditorContainerProps> = (args) => {
  return (
    <DataDataContext.Provider value={createContextValue()}>
      <EntityEditorContainer {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
Normal.args = { entitySelector: { id: foo1Id } };
