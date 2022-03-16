import type { AdminClient, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useContext, useReducer } from 'react';
import type { EntityEditorSelector } from '../..';
import {
  AddEntityDraftAction,
  DataDataContext,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  EntityMetadata,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '../..';
import { foo1Id, fooArchivedId } from '../../test/EntityFixtures';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import { createBackendAdminClient, SlowMiddleware } from '../../test/TestContextAdapter';
import { EntityLoader } from '../EntityEditor/EntityEditor';
import type { EntityMetadataProps } from './EntityMetadata';

export type EntityMetadataStoryProps = Omit<EntityMetadataProps, 'entityId'> & {
  entitySelector: EntityEditorSelector;
  adminClient?: () => PromiseResult<AdminClient, ErrorType>;
};

const meta: Meta<EntityMetadataProps> = {
  title: 'Domain/EntityMetadata',
  component: EntityMetadata,
  args: {},
};
export default meta;

const Template: Story<EntityMetadataStoryProps> = (args) => {
  return (
    <LoadContextProvider adminClient={args.adminClient}>
      <Wrapper
        className={args.className}
        entitySelector={args.entitySelector}
        initialSelectedHistory={args.initialSelectedHistory}
      />
    </LoadContextProvider>
  );
};

function Wrapper({
  className,
  entitySelector,
  initialSelectedHistory,
}: {
  className?: string;
  entitySelector: EntityEditorSelector;
  initialSelectedHistory?: 'entity' | 'publish';
}) {
  const { schema } = useContext(DataDataContext);
  const [editorState, dispatchEditorState] = useReducer(
    reduceEntityEditorState,
    { schema, actions: [new AddEntityDraftAction(entitySelector)] },
    initializeEntityEditorState
  );
  const draftState = editorState.drafts[0];

  // EntityLoader is needed since we don't use any EntityEditor here
  return (
    <EntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <EntityEditorStateContext.Provider value={editorState}>
        <EntityLoader entityId={draftState.id} />
        <EntityMetadata
          entityId={draftState.id}
          className={className}
          initialSelectedHistory={initialSelectedHistory}
        />
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}

export const NewFoo = Template.bind({});
NewFoo.args = { entitySelector: { newType: 'Foo', id: 'e225c183-9a1d-4fd5-b259-cdc37421d5ce' } };

export const FullFoo = Template.bind({});
FullFoo.args = { entitySelector: { id: foo1Id } };

export const FullFooPublishingHistory = Template.bind({});
FullFooPublishingHistory.args = {
  entitySelector: { id: foo1Id },
  initialSelectedHistory: 'publish',
};

export const ArchivedFoo = Template.bind({});
ArchivedFoo.args = { entitySelector: { id: fooArchivedId } };

export const ArchivedFooPublishingHistory = Template.bind({});
ArchivedFooPublishingHistory.args = {
  entitySelector: { id: fooArchivedId },
  initialSelectedHistory: 'publish',
};

export const SlowFullFoo = Template.bind({});
SlowFullFoo.args = {
  entitySelector: { id: foo1Id },
  adminClient: async () => ok(createBackendAdminClient([SlowMiddleware])),
};
