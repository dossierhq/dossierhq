import type { AdminClient, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React, { useContext, useReducer } from 'react';
import type { EntityEditorProps, EntityEditorSelector } from '../../index.js';
import {
  AddEntityDraftAction,
  DataDataContext,
  EntityEditor,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '../../index.js';
import { baz1Id, foo1Id, fooArchivedId } from '../../test/EntityFixtures.js';
import { LoadContextProvider } from '../../test/LoadContextProvider.js';
import { LoadFixtures } from '../../test/LoadFixtures.js';
import { createBackendAdminClient, SlowMiddleware } from '../../test/TestContextAdapter.js';

export type EntityEditorStoryProps = Omit<EntityEditorProps, 'entityId'> & {
  entitySelector: EntityEditorSelector;
  adminClient?: () => PromiseResult<AdminClient, ErrorType>;
};

const meta: Meta<EntityEditorStoryProps> = {
  title: 'Domain/EntityEditor',
  component: EntityEditor,
  args: {},
};
export default meta;

const Template: Story<EntityEditorStoryProps> = (args) => {
  return (
    <LoadContextProvider adminClient={args.adminClient}>
      <LoadFixtures>
        <Wrapper entitySelector={args.entitySelector} />
      </LoadFixtures>
    </LoadContextProvider>
  );
};

function Wrapper({ entitySelector }: { entitySelector: EntityEditorSelector }) {
  const { schema } = useContext(DataDataContext);
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
  adminClient: async () => ok(createBackendAdminClient([SlowMiddleware])),
};

export const NotFound = Template.bind({});
NotFound.args = { entitySelector: { id: 'c6f97fae-1213-4be0-996f-4f20c7da7e65' } };

export const InvalidTypeNewEntity = Template.bind({});
InvalidTypeNewEntity.args = {
  entitySelector: { id: 'da4a48d6-341e-4515-941f-b83578191b51', newType: 'InvalidType' },
};
