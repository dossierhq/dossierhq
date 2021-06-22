import type { Schema } from '@datadata/core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useReducer } from 'react';
import type { EntityEditorProps, EntityEditorSelector } from '../..';
import {
  AddEntityDraftAction,
  DataDataContext,
  EntityEditor,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '../..';
import { baz1Id, foo1Id, fooArchivedId } from '../../test/EntityFixtures';
import {
  createContextValue,
  SlowInterceptor,
  TestContextAdapter,
} from '../../test/TestContextAdapter';

export type EntityEditorStoryProps = Omit<EntityEditorProps, 'entityId'> & {
  entitySelector: EntityEditorSelector;
  contextAdapter?: TestContextAdapter;
};

const meta: Meta<EntityEditorStoryProps> = {
  title: 'Domain/EntityEditor',
  component: EntityEditor,
  args: {},
};
export default meta;

const Template: Story<EntityEditorStoryProps> = (args) => {
  const contextValue = createContextValue(args?.contextAdapter);
  return (
    <DataDataContext.Provider value={contextValue}>
      <Wrapper entitySelector={args.entitySelector} schema={contextValue.schema} />
    </DataDataContext.Provider>
  );
};

function Wrapper({
  entitySelector,
  schema,
}: {
  entitySelector: EntityEditorSelector;
  schema: Schema;
}) {
  const [editorState, dispatchEditorState] = useReducer(
    reduceEntityEditorState,
    { schema, actions: [new AddEntityDraftAction(entitySelector)] },
    initializeEntityEditorState
  );
  const draftState = editorState.drafts[0];

  return (
    <EntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <EntityEditorStateContext.Provider value={editorState}>
        <EntityEditor entityId={draftState.id} />
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}

export const NewFoo = Template.bind({});
NewFoo.args = { entitySelector: { id: '82ded109-44f2-48b9-a676-43162fda3d7d', newType: 'Foo' } };

export const FullFoo = Template.bind({});
FullFoo.args = { entitySelector: { id: foo1Id } };

export const ArchivedFoo = Template.bind({});
ArchivedFoo.args = { entitySelector: { id: fooArchivedId } };

export const FullBaz = Template.bind({});
FullBaz.args = { entitySelector: { id: baz1Id } };

export const SlowFullFoo = Template.bind({});
SlowFullFoo.args = {
  entitySelector: { id: foo1Id },
  contextAdapter: new TestContextAdapter(SlowInterceptor),
};

export const NotFound = Template.bind({});
NotFound.args = { entitySelector: { id: 'c6f97fae-1213-4be0-996f-4f20c7da7e65' } };

export const InvalidTypeNewEntity = Template.bind({});
InvalidTypeNewEntity.args = {
  entitySelector: { id: 'da4a48d6-341e-4515-941f-b83578191b51', newType: 'InvalidType' },
};
