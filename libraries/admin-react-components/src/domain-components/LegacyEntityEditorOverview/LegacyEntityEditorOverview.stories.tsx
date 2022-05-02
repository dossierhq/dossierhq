import type { AdminClientMiddleware, ClientContext } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useContext, useReducer } from 'react';
import type { LegacyEntityEditorSelector } from '../..';
import {
  LegacyDataDataContext,
  LegacyEntityEditorDispatchContext,
  LegacyEntityEditorStateContext,
} from '../..';
import { bar1Id, bar2Id, foo1Id, fooArchivedId } from '../../test/EntityFixtures';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import { LoadFixtures } from '../../test/LoadFixtures';
import { SlowMiddleware } from '../../test/TestContextAdapter';
import { LegacyEntityLoader } from '../LegacyEntityEditor/LegacyEntityEditor';
import {
  initializeLegacyEntityEditorState,
  LegacyAddEntityDraftAction,
  reduceLegacyEntityEditorState,
} from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import type { LegacyEntityEditorOverviewProps } from './LegacyEntityEditorOverview';
import { LegacyEntityEditorOverview } from './LegacyEntityEditorOverview';

interface StoryProps extends LegacyEntityEditorOverviewProps {
  entitySelectors?: LegacyEntityEditorSelector[];
  adminClientMiddleware?: AdminClientMiddleware<ClientContext>[];
}

const meta: Meta<StoryProps> = {
  title: 'Domain/LegacyEntityEditorOverview',
  component: LegacyEntityEditorOverview,
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return (
    <LoadContextProvider adminClientMiddleware={args.adminClientMiddleware}>
      <LoadFixtures>
        <Wrapper {...args} />
      </LoadFixtures>
    </LoadContextProvider>
  );
};

function Wrapper({ entitySelectors }: { entitySelectors?: LegacyEntityEditorSelector[] }) {
  const { schema } = useContext(LegacyDataDataContext);
  const [editorState, dispatchEditorState] = useReducer(
    reduceLegacyEntityEditorState,
    { schema, actions: entitySelectors?.map((x) => new LegacyAddEntityDraftAction(x)) },
    initializeLegacyEntityEditorState
  );
  // EntityLoader is needed since we don't use any EntityEditor here

  return (
    <LegacyEntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <LegacyEntityEditorStateContext.Provider value={editorState}>
        {entitySelectors?.map(({ id }) =>
          id ? <LegacyEntityLoader key={id} entityId={id} /> : null
        )}
        <LegacyEntityEditorOverview />
      </LegacyEntityEditorStateContext.Provider>
    </LegacyEntityEditorDispatchContext.Provider>
  );
}

export const Normal = Template.bind({});
Normal.args = {
  entitySelectors: [{ id: foo1Id }, { id: bar1Id }, { id: bar2Id }, { id: fooArchivedId }],
};

export const Slow = Template.bind({});
Slow.args = {
  entitySelectors: [{ id: foo1Id }, { id: bar1Id }, { id: bar2Id }, { id: fooArchivedId }],
  adminClientMiddleware: [SlowMiddleware],
};
