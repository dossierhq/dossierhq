import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityEditor } from './EntityEditor';
import type { EntityEditorProps } from './EntityEditor';
import { foo1Id, fooDeletedId } from '../../test/EntityFixtures';
import TestContextValue from '../../test/TestContextValue';

export default {
  title: 'Domain/EntityEditor',
  component: EntityEditor,
  args: {},
};

const Template: Story<EntityEditorProps & { contextValue?: TestContextValue }> = (args) => {
  return (
    <DataDataContext.Provider value={args.contextValue ?? new TestContextValue()}>
      <EntityEditor {...args} />
    </DataDataContext.Provider>
  );
};

export const NewFoo = Template.bind({});
NewFoo.args = { entity: { type: 'Foo', isNew: true }, idPrefix: 'new-entity-123' };

export const FullFoo = Template.bind({});
FullFoo.args = { entity: { id: foo1Id } };

export const DeletedFoo = Template.bind({});
DeletedFoo.args = { entity: { id: fooDeletedId } };
