import type { AdminClientMiddleware, ClientContext } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useContext, useReducer } from 'react';
import { LegacyDataDataContext } from '../../contexts/LegacyDataDataContext';
import {
  LegacyEntityEditorDispatchContext,
  LegacyEntityEditorStateContext,
} from '../../contexts/LegacyEntityEditorState';
import { bar1Id, bar2Id, foo1Id, fooArchivedId, qux1Id } from '../../test/EntityFixtures';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import { LoadFixtures } from '../../test/LoadFixtures';
import { createSlowAdminMiddleware } from '../../test/TestContextAdapter';
import type { LegacyEntityEditorSelector } from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import {
  initializeLegacyEntityEditorState,
  LegacyAddEntityDraftAction,
  reduceLegacyEntityEditorState,
} from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import type { LegacyEntityEditorContainerProps } from './LegacyEntityEditorContainer';
import { LegacyEntityEditorContainer } from './LegacyEntityEditorContainer';

interface StoryProps extends LegacyEntityEditorContainerProps {
  entitySelectors?: LegacyEntityEditorSelector[];
  adminClientMiddleware?: AdminClientMiddleware<ClientContext>[];
}

const meta: Meta<StoryProps> = {
  title: 'Domain/LegacyEntityEditorContainer',
  component: LegacyEntityEditorContainer,
  args: { className: 'position-fixed inset-0' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return (
    <AdminLoadContextProvider adminClientMiddleware={args.adminClientMiddleware}>
      <LoadFixtures>
        <Wrapper {...args} />
      </LoadFixtures>
    </AdminLoadContextProvider>
  );
};

function Wrapper({
  className,
  entitySelectors,
}: {
  className?: string;
  entitySelectors?: LegacyEntityEditorSelector[];
}) {
  const { schema } = useContext(LegacyDataDataContext);
  const [editorState, dispatchEditorState] = useReducer(
    reduceLegacyEntityEditorState,
    { schema, actions: entitySelectors?.map((x) => new LegacyAddEntityDraftAction(x)) },
    initializeLegacyEntityEditorState
  );

  return (
    <LegacyEntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <LegacyEntityEditorStateContext.Provider value={editorState}>
        <LegacyEntityEditorContainer className={className} />
      </LegacyEntityEditorStateContext.Provider>
    </LegacyEntityEditorDispatchContext.Provider>
  );
}

export const NewFoo = Template.bind({});
NewFoo.args = { entitySelectors: [{ newType: 'Foo' }] };

export const FullFoo = Template.bind({});
FullFoo.args = { entitySelectors: [{ id: foo1Id }] };

export const AdminOnlyQux = Template.bind({});
AdminOnlyQux.args = { entitySelectors: [{ id: qux1Id }] };

export const ArchivedFoo = Template.bind({});
ArchivedFoo.args = { entitySelectors: [{ id: fooArchivedId }] };

export const TwoEntities = Template.bind({});
TwoEntities.args = { entitySelectors: [{ id: bar1Id }, { id: bar2Id }] };

export const SlowFullFoo = Template.bind({});
SlowFullFoo.args = {
  entitySelectors: [{ id: foo1Id }],
  adminClientMiddleware: [createSlowAdminMiddleware()],
};

export const NotFound = Template.bind({});
NotFound.args = { entitySelectors: [{ id: 'c6f97fae-1213-4be0-996f-4f20c7da7e65' }] };

export const InvalidTypeNewEntity = Template.bind({});
InvalidTypeNewEntity.args = {
  entitySelectors: [{ id: 'da4a48d6-341e-4515-941f-b83578191b51', newType: 'InvalidType' }],
};
