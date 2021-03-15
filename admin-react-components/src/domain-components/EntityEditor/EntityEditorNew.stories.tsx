import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { DataDataContextValue, EntityEditorNewProps } from '../..';
import { DataDataContext, EntityEditorNew } from '../..';
import type { EntityEditorSelector } from './EntityEditorReducer';
import { useEntityEditorState } from './EntityEditorReducer';
import { foo1Id, fooDeletedId } from '../../test/EntityFixtures';
import {
  createContextValue,
  SlowInterceptor,
  TestContextAdapter,
} from '../../test/TestContextAdapter';

type StoryProps = Omit<EntityEditorNewProps, 'editorState' | 'dispatchEditorState'> & {
  entitySelector: EntityEditorSelector;
  contextAdapter?: TestContextAdapter;
};

const meta: Meta<StoryProps> = {
  title: 'Domain/EntityEditorNew',
  component: EntityEditorNew,
  args: {},
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  const contextValue = createContextValue(args?.contextAdapter);
  return (
    <DataDataContext.Provider value={contextValue}>
      <Wrapper entitySelector={args.entitySelector} contextValue={contextValue} />
    </DataDataContext.Provider>
  );
};

function Wrapper({
  entitySelector,
  contextValue,
}: {
  entitySelector: EntityEditorSelector;
  contextValue: DataDataContextValue;
}) {
  const { editorState, dispatchEditorState } = useEntityEditorState(entitySelector, contextValue);
  return <EntityEditorNew editorState={editorState} dispatchEditorState={dispatchEditorState} />;
}

export const NewFoo = Template.bind({});
NewFoo.args = { entitySelector: { id: '82ded109-44f2-48b9-a676-43162fda3d7d', newType: 'Foo' } };

export const FullFoo = Template.bind({});
FullFoo.args = { entitySelector: { id: foo1Id } };

export const DeletedFoo = Template.bind({});
DeletedFoo.args = { entitySelector: { id: fooDeletedId } };

export const SlowFullFoo = Template.bind({});
SlowFullFoo.args = {
  entitySelector: { id: foo1Id },
  contextAdapter: new TestContextAdapter(SlowInterceptor),
};

export const NotFound = Template.bind({});
NotFound.args = { entitySelector: { id: 'c6f97fae-1213-4be0-996f-4f20c7da7e65' } };

export const InvalidTypeNewEntity = Template.bind({});
InvalidTypeNewEntity.args = {
  entitySelector: { id: 'da4a48d6-341e-4515-941f-b83578191b51', newType: 'InvalidType' },
};
