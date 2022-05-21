import type { AdminClientMiddleware, ClientContext } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useContext, useReducer } from 'react';
import { LegacyDataDataContext } from '../../contexts/LegacyDataDataContext';
import {
  LegacyEntityEditorDispatchContext,
  LegacyEntityEditorStateContext,
} from '../../contexts/LegacyEntityEditorState';
import { foo1Id, fooArchivedId } from '../../test/EntityFixtures';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import { createSlowAdminMiddleware } from '../../test/TestContextAdapter';
import { LegacyEntityLoader } from '../LegacyEntityEditor/LegacyEntityEditor';
import type { LegacyEntityEditorSelector } from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import {
  reduceLegacyEntityEditorState,
  LegacyAddEntityDraftAction,
  initializeLegacyEntityEditorState,
} from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import type { LegacyEntityMetadataProps } from './LegacyEntityMetadata';
import { LegacyEntityMetadata } from './LegacyEntityMetadata';

export type EntityMetadataStoryProps = Omit<LegacyEntityMetadataProps, 'entityId'> & {
  entitySelector: LegacyEntityEditorSelector;
  adminClientMiddleware?: AdminClientMiddleware<ClientContext>[];
};

const meta: Meta<LegacyEntityMetadataProps> = {
  title: 'Domain/LegacyEntityMetadata',
  component: LegacyEntityMetadata,
  args: {},
};
export default meta;

const Template: Story<EntityMetadataStoryProps> = (args) => {
  return (
    <AdminLoadContextProvider adminClientMiddleware={args.adminClientMiddleware}>
      <Wrapper
        className={args.className}
        entitySelector={args.entitySelector}
        initialSelectedHistory={args.initialSelectedHistory}
      />
    </AdminLoadContextProvider>
  );
};

function Wrapper({
  className,
  entitySelector,
  initialSelectedHistory,
}: {
  className?: string;
  entitySelector: LegacyEntityEditorSelector;
  initialSelectedHistory?: 'entity' | 'publish';
}) {
  const { schema } = useContext(LegacyDataDataContext);
  const [editorState, dispatchEditorState] = useReducer(
    reduceLegacyEntityEditorState,
    { schema, actions: [new LegacyAddEntityDraftAction(entitySelector)] },
    initializeLegacyEntityEditorState
  );
  const draftState = editorState.drafts[0];

  // EntityLoader is needed since we don't use any EntityEditor here
  return (
    <LegacyEntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <LegacyEntityEditorStateContext.Provider value={editorState}>
        <LegacyEntityLoader entityId={draftState.id} />
        <LegacyEntityMetadata
          entityId={draftState.id}
          className={className}
          initialSelectedHistory={initialSelectedHistory}
        />
      </LegacyEntityEditorStateContext.Provider>
    </LegacyEntityEditorDispatchContext.Provider>
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
  adminClientMiddleware: [createSlowAdminMiddleware()],
};
