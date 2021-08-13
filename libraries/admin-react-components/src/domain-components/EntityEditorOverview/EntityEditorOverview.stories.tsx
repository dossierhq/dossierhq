import type { Schema } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useReducer } from 'react';
import type { DataDataContextValue, EntityEditorSelector } from '../..';
import { DataDataContext, EntityEditorDispatchContext, EntityEditorStateContext } from '../..';
import { EntityEditorOverview } from './EntityEditorOverview';
import type { EntityEditorOverviewProps } from './EntityEditorOverview';
import { createContextValue, SlowMiddleware } from '../../test/TestContextAdapter';
import { bar1Id, bar2Id, foo1Id, fooArchivedId } from '../../test/EntityFixtures';
import {
  AddEntityDraftAction,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '../EntityEditor/EntityEditorReducer';
import { EntityLoader } from '../EntityEditor/EntityEditor';

interface StoryProps extends EntityEditorOverviewProps {
  entitySelectors?: EntityEditorSelector[];
  contextValue?: () => DataDataContextValue;
}

const meta: Meta<StoryProps> = {
  title: 'Domain/EntityEditorOverview',
  component: EntityEditorOverview,
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  const contextValue = args.contextValue?.() ?? createContextValue().contextValue;
  return (
    <DataDataContext.Provider value={contextValue}>
      <Wrapper {...args} schema={contextValue.schema} />
    </DataDataContext.Provider>
  );
};

function Wrapper({
  entitySelectors,
  schema,
}: {
  className?: string;
  entitySelectors?: EntityEditorSelector[];
  schema: Schema;
}) {
  const [editorState, dispatchEditorState] = useReducer(
    reduceEntityEditorState,
    { schema, actions: entitySelectors?.map((x) => new AddEntityDraftAction(x)) },
    initializeEntityEditorState
  );
  // EntityLoader is needed since we don't use any EntityEditor here

  return (
    <EntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <EntityEditorStateContext.Provider value={editorState}>
        {entitySelectors?.map(({ id }) => (id ? <EntityLoader key={id} entityId={id} /> : null))}
        <EntityEditorOverview />
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}

export const Normal = Template.bind({});
Normal.args = {
  entitySelectors: [{ id: foo1Id }, { id: bar1Id }, { id: bar2Id }, { id: fooArchivedId }],
};

export const Slow = Template.bind({});
Slow.args = {
  entitySelectors: [{ id: foo1Id }, { id: bar1Id }, { id: bar2Id }, { id: fooArchivedId }],
  contextValue: () => createContextValue({ adminClientMiddleware: [SlowMiddleware] }).contextValue,
};
