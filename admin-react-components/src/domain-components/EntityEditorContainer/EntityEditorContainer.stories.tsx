import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityEditorContainer } from './EntityEditorContainer';
import type { EntityEditorContainerProps } from './EntityEditorContainer';
import TestContextValue from '../../test/TestContextValue';
import { foo1Id } from '../../test/EntityFixtures';

const defaultArgs: Partial<EntityEditorContainerProps> = { idPrefix: 'id-123' };

export default {
  title: 'Domain/EntityEditorContainer',
  component: EntityEditorContainer,
  args: defaultArgs,
};

const Template: Story<EntityEditorContainerProps> = (args) => {
  return (
    <DataDataContext.Provider value={new TestContextValue()}>
      <EntityEditorContainer {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
Normal.args = { entity: { id: foo1Id } };
