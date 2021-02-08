import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityEditor } from './EntityEditor';
import type { EntityEditorProps } from './EntityEditor';
import { foo1Id, fooDeletedId, getEntityFixture } from '../../test/EntityFixtures';
import TestContextValue from '../../test/TestContextValue';

export default {
  title: 'Domain/EntityEditor',
  component: EntityEditor,
  argTypes: { onSubmit: { action: 'submit' } },
  args: {},
};

const Template: Story<EntityEditorProps> = (args) => {
  return (
    <DataDataContext.Provider value={new TestContextValue()}>
      <EntityEditor {...args} />
    </DataDataContext.Provider>
  );
};

export const NewFoo = Template.bind({});
NewFoo.args = { entity: { _type: 'Foo' }, idPrefix: 'new-entity-123' };

export const FullFoo = Template.bind({});
FullFoo.args = {
  entity: getEntityFixture(foo1Id),
};

export const DeletedFoo = Template.bind({});
DeletedFoo.args = {
  entity: getEntityFixture(fooDeletedId),
};
