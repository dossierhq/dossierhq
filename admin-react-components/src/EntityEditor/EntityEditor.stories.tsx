import { ok } from '@datadata/core';
import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityEditor } from './EntityEditor';
import type { EntityEditorProps } from './EntityEditor';
import schema from '../StoryboardSchema';

export default {
  title: 'Components/EntityEditor',
  component: EntityEditor,
  argTypes: { onSubmit: { action: 'submit' } },
  args: {},
};

const Template: Story<EntityEditorProps> = (args) => {
  return (
    <DataDataContext.Provider value={{ schema, searchEntities: () => Promise.resolve(ok(null)) }}>
      <EntityEditor {...args} />
    </DataDataContext.Provider>
  );
};

export const NewFoo = Template.bind({});
NewFoo.args = { entity: { _type: 'Foo' }, idPrefix: 'new-entity-123' };

export const FullFoo = Template.bind({});
FullFoo.args = {
  entity: {
    id: 'fc66b4d7-61ff-44d4-8f68-cb7f526df046',
    _type: 'Foo',
    _name: 'Hello',
    _version: 0,
    title: 'Hello',
  },
};

export const DeletedFoo = Template.bind({});
DeletedFoo.args = {
  entity: {
    id: 'fc66b4d7-61ff-44d4-8f68-cb7f526df046',
    _type: 'Foo',
    _name: 'Hello',
    _version: 1,
    _deleted: true,
  },
};
