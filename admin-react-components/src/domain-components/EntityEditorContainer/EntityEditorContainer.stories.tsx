import type { Schema } from '@datadata/core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useEffect, useReducer } from 'react';
import type { EntityEditorSelector } from '../..';
import { DataDataContext } from '../..';
import { EntityEditorContainer } from './EntityEditorContainer';
import type { EntityEditorContainerProps } from './EntityEditorContainer';
import {
  createContextValue,
  SlowInterceptor,
  TestContextAdapter,
} from '../../test/TestContextAdapter';
import { bar1Id, bar2Id, foo1Id, fooDeletedId } from '../../test/EntityFixtures';
import {
  AddEntityDraftAction,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '../EntityEditor/EntityEditorReducer';

interface StoryProps extends EntityEditorContainerProps {
  contextAdapter?: TestContextAdapter;
  entitySelectors?: EntityEditorSelector[];
}

const meta: Meta<StoryProps> = {
  title: 'Domain/EntityEditorContainer',
  component: EntityEditorContainer,
  args: {},
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  const contextValue = createContextValue(args.contextAdapter);
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
  entitySelectors?: EntityEditorSelector[];
  schema: Schema;
}) {
  const [editorState, dispatchEditorState] = useReducer(
    reduceEntityEditorState,
    { schema },
    initializeEntityEditorState
  );
  useEffect(() => {
    for (const entitySelector of entitySelectors ?? []) {
      dispatchEditorState(new AddEntityDraftAction(entitySelector));
    }
  }, [entitySelectors]);

  return (
    <EntityEditorContainer editorState={editorState} dispatchEditorState={dispatchEditorState} />
  );
}

export const NewFoo = Template.bind({});
NewFoo.args = { entitySelectors: [{ id: '82ded109-44f2-48b9-a676-43162fda3d7d', newType: 'Foo' }] };

export const FullFoo = Template.bind({});
FullFoo.args = { entitySelectors: [{ id: foo1Id }] };

export const DeletedFoo = Template.bind({});
DeletedFoo.args = { entitySelectors: [{ id: fooDeletedId }] };

export const TwoEntities = Template.bind({});
TwoEntities.args = { entitySelectors: [{ id: bar1Id }, { id: bar2Id }] };

export const SlowFullFoo = Template.bind({});
SlowFullFoo.args = {
  entitySelectors: [{ id: foo1Id }],
  contextAdapter: new TestContextAdapter(SlowInterceptor),
};

export const NotFound = Template.bind({});
NotFound.args = { entitySelectors: [{ id: 'c6f97fae-1213-4be0-996f-4f20c7da7e65' }] };

export const InvalidTypeNewEntity = Template.bind({});
InvalidTypeNewEntity.args = {
  entitySelectors: [{ id: 'da4a48d6-341e-4515-941f-b83578191b51', newType: 'InvalidType' }],
};
