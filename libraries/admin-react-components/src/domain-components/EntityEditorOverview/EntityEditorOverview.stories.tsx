import type { AdminClient, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useContext, useReducer } from 'react';
import type { EntityEditorSelector } from '../..';
import { DataDataContext, EntityEditorDispatchContext, EntityEditorStateContext } from '../..';
import { bar1Id, bar2Id, foo1Id, fooArchivedId } from '../../test/EntityFixtures';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import { LoadFixtures } from '../../test/LoadFixtures';
import { createBackendAdminClient, SlowMiddleware } from '../../test/TestContextAdapter';
import { EntityLoader } from '../EntityEditor/EntityEditor';
import {
  AddEntityDraftAction,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '../EntityEditor/EntityEditorReducer';
import type { EntityEditorOverviewProps } from './EntityEditorOverview';
import { EntityEditorOverview } from './EntityEditorOverview';

interface StoryProps extends EntityEditorOverviewProps {
  entitySelectors?: EntityEditorSelector[];
  adminClient?: () => PromiseResult<AdminClient, ErrorType>;
}

const meta: Meta<StoryProps> = {
  title: 'Domain/EntityEditorOverview',
  component: EntityEditorOverview,
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return (
    <LoadContextProvider adminClient={args.adminClient}>
      <LoadFixtures>
        <Wrapper {...args} />
      </LoadFixtures>
    </LoadContextProvider>
  );
};

function Wrapper({ entitySelectors }: { entitySelectors?: EntityEditorSelector[] }) {
  const { schema } = useContext(DataDataContext);
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
  adminClient: async () => ok(createBackendAdminClient([SlowMiddleware])),
};
