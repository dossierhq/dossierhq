import type { AdminClientMiddleware, ClientContext } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useContext, useReducer } from 'react';
import { LegacyDataDataContext } from '../../contexts/LegacyDataDataContext';
import {
  LegacyEntityEditorDispatchContext,
  LegacyEntityEditorStateContext,
} from '../../contexts/LegacyEntityEditorState';
import { baz1Id, foo1Id, fooArchivedId } from '../../test/EntityFixtures';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import { LoadFixtures } from '../../test/LoadFixtures';
import { SlowMiddleware } from '../../test/TestContextAdapter';
import type { LegacyEntityEditorProps } from './LegacyEntityEditor';
import { LegacyEntityEditor } from './LegacyEntityEditor';
import type { LegacyEntityEditorSelector } from './LegacyEntityEditorReducer';
import {
  initializeLegacyEntityEditorState,
  LegacyAddEntityDraftAction,
  reduceLegacyEntityEditorState,
} from './LegacyEntityEditorReducer';

export type LegacyEntityEditorStoryProps = Omit<LegacyEntityEditorProps, 'entityId'> & {
  entitySelector: LegacyEntityEditorSelector;
  adminClientMiddleware?: AdminClientMiddleware<ClientContext>[];
};

const meta: Meta<LegacyEntityEditorStoryProps> = {
  title: 'Domain/LegacyEntityEditor',
  component: LegacyEntityEditor,
  args: {},
};
export default meta;

const Template: Story<LegacyEntityEditorStoryProps> = (args) => {
  return (
    <LoadContextProvider adminClientMiddleware={args.adminClientMiddleware}>
      <LoadFixtures>
        <Wrapper entitySelector={args.entitySelector} />
      </LoadFixtures>
    </LoadContextProvider>
  );
};

function Wrapper({ entitySelector }: { entitySelector: LegacyEntityEditorSelector }) {
  const { schema } = useContext(LegacyDataDataContext);
  const [editorState, dispatchEditorState] = useReducer(
    reduceLegacyEntityEditorState,
    { schema, actions: [new LegacyAddEntityDraftAction(entitySelector)] },
    initializeLegacyEntityEditorState
  );
  const draftState = editorState.drafts[0];

  return (
    <LegacyEntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <LegacyEntityEditorStateContext.Provider value={editorState}>
        <LegacyEntityEditor entityId={draftState.id} />
      </LegacyEntityEditorStateContext.Provider>
    </LegacyEntityEditorDispatchContext.Provider>
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
  adminClientMiddleware: [SlowMiddleware],
};

export const NotFound = Template.bind({});
NotFound.args = { entitySelector: { id: 'c6f97fae-1213-4be0-996f-4f20c7da7e65' } };

export const InvalidTypeNewEntity = Template.bind({});
InvalidTypeNewEntity.args = {
  entitySelector: { id: 'da4a48d6-341e-4515-941f-b83578191b51', newType: 'InvalidType' },
};
