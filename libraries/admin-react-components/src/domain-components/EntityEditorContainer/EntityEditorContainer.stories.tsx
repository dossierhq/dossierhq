import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import type { DataDataContextValue, EntityEditorSelector } from '../..';
import {
  DataDataContext,
  EntityEditorContainer,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
} from '../..';
import { bar1Id, bar2Id, foo1Id, fooArchivedId } from '../../test/EntityFixtures';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import { createContextValue2, SlowMiddleware } from '../../test/TestContextAdapter';
import {
  AddEntityDraftAction,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '../EntityEditor/EntityEditorReducer';
import type { EntityEditorContainerProps } from './EntityEditorContainer';

interface StoryProps extends EntityEditorContainerProps {
  entitySelectors?: EntityEditorSelector[];
  contextValue?: () => PromiseResult<DataDataContextValue, ErrorType>;
}

const meta: Meta<StoryProps> = {
  title: 'Domain/EntityEditorContainer',
  component: EntityEditorContainer,
  args: { className: 'position-fixed inset-0' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return (
    <LoadContextProvider contextValue={args.contextValue}>
      <Wrapper {...args} />
    </LoadContextProvider>
  );
};

function Wrapper({
  className,
  entitySelectors,
}: {
  className?: string;
  entitySelectors?: EntityEditorSelector[];
}) {
  const { schema } = useContext(DataDataContext);
  const [editorState, dispatchEditorState] = useReducer(
    reduceEntityEditorState,
    { schema, actions: entitySelectors?.map((x) => new AddEntityDraftAction(x)) },
    initializeEntityEditorState
  );
  return (
    <EntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <EntityEditorStateContext.Provider value={editorState}>
        <EntityEditorContainer className={className} />
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}

export const NewFoo = Template.bind({});
NewFoo.args = { entitySelectors: [{ id: '82ded109-44f2-48b9-a676-43162fda3d7d', newType: 'Foo' }] };

export const FullFoo = Template.bind({});
FullFoo.args = { entitySelectors: [{ id: foo1Id }] };

export const ArchivedFoo = Template.bind({});
ArchivedFoo.args = { entitySelectors: [{ id: fooArchivedId }] };

export const TwoEntities = Template.bind({});
TwoEntities.args = { entitySelectors: [{ id: bar1Id }, { id: bar2Id }] };

export const SlowFullFoo = Template.bind({});
SlowFullFoo.args = {
  entitySelectors: [{ id: foo1Id }],
  contextValue: () => createContextValue2([SlowMiddleware]),
};

export const NotFound = Template.bind({});
NotFound.args = { entitySelectors: [{ id: 'c6f97fae-1213-4be0-996f-4f20c7da7e65' }] };

export const InvalidTypeNewEntity = Template.bind({});
InvalidTypeNewEntity.args = {
  entitySelectors: [{ id: 'da4a48d6-341e-4515-941f-b83578191b51', newType: 'InvalidType' }],
};
