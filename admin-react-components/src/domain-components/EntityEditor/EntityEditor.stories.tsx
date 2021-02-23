import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { DataDataContextValue, EntityEditorProps } from '../..';
import { DataDataContext, EntityEditor } from '../..';
import { foo1Id, fooDeletedId } from '../../test/EntityFixtures';
import { SlowTestContextValue } from '../../test/SlowTestContextValue';
import TestContextValue from '../../test/TestContextValue';

export default {
  title: 'Domain/EntityEditor',
  component: EntityEditor,
  args: {},
};

const Template: Story<EntityEditorProps & { contextValue?: DataDataContextValue }> = (args) => {
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

export const SlowFullFoo = Template.bind({});
SlowFullFoo.args = {
  entity: { id: foo1Id },
  contextValue: new SlowTestContextValue(new TestContextValue()),
};

export const NotFound = Template.bind({});
NotFound.args = { entity: { id: 'c6f97fae-1213-4be0-996f-4f20c7da7e65' } };

export const InvalidTypeNewEntity = Template.bind({});
InvalidTypeNewEntity.args = {
  entity: { type: 'InvalidType', isNew: true },
  idPrefix: 'new-entity-123',
};
