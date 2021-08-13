import type { Schema } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useReducer } from 'react';
import type { DataDataContextValue, EntityEditorSelector } from '../..';
import {
  AddEntityDraftAction,
  DataDataContext,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  EntityMetadata,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '../..';
import type { EntityMetadataProps } from './EntityMetadata';
import { EntityLoader } from '../EntityEditor/EntityEditor';
import { foo1Id, fooArchivedId } from '../../test/EntityFixtures';
import { createContextValue, SlowMiddleware } from '../../test/TestContextAdapter';

export type EntityMetadataStoryProps = Omit<EntityMetadataProps, 'entityId'> & {
  entitySelector: EntityEditorSelector;
  contextValue?: () => DataDataContextValue;
};

const meta: Meta<EntityMetadataProps> = {
  title: 'Domain/EntityMetadata',
  component: EntityMetadata,
  args: {},
};
export default meta;

const Template: Story<EntityMetadataStoryProps> = (args) => {
  const contextValue = args.contextValue?.() ?? createContextValue().contextValue;
  return (
    <DataDataContext.Provider value={contextValue}>
      <Wrapper
        className={args.className}
        entitySelector={args.entitySelector}
        initialSelectedHistory={args.initialSelectedHistory}
        schema={contextValue.schema}
      />
    </DataDataContext.Provider>
  );
};

function Wrapper({
  className,
  entitySelector,
  initialSelectedHistory,
  schema,
}: {
  className?: string;
  entitySelector: EntityEditorSelector;
  initialSelectedHistory?: 'entity' | 'publish';
  schema: Schema;
}) {
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
  contextValue: () => createContextValue({ adminClientMiddleware: [SlowMiddleware] }).contextValue,
};
