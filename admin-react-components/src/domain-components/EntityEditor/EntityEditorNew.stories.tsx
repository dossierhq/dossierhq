import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { DataDataContextValue, EntityEditorNewProps } from '../..';
import { DataDataContext, EntityEditorNew } from '../..';
import { foo1Id, fooDeletedId } from '../../test/EntityFixtures';
import {
  SlowInterceptor,
  createContextValue,
  TestContextAdapter,
} from '../../test/TestContextAdapter';
import { useEntityEditorState } from './EntityEditorReducer';

export default {
  title: 'Domain/EntityEditorNew',
  component: EntityEditorNew,
  args: {},
};

const Template: Story<
  Omit<EntityEditorNewProps, 'editorState' | 'dispatchEditorState'> & {
    id: string;
    contextAdapter?: TestContextAdapter;
  }
> = (args) => {
  const contextValue = createContextValue(args?.contextAdapter);
  return (
    <DataDataContext.Provider value={contextValue}>
      <Wrapper id={args.id} contextValue={contextValue} />
    </DataDataContext.Provider>
  );
};

function Wrapper({ id, contextValue }: { id: string; contextValue: DataDataContextValue }) {
  const { editorState, dispatchEditorState } = useEntityEditorState(id, contextValue);
  return <EntityEditorNew editorState={editorState} dispatchEditorState={dispatchEditorState} />;
}

// export const NewFoo = Template.bind({});
// NewFoo.args = { entity: { type: 'Foo', isNew: true }, idPrefix: 'new-entity-123' };

export const FullFoo = Template.bind({});
FullFoo.args = { id: foo1Id };

export const DeletedFoo = Template.bind({});
DeletedFoo.args = { id: fooDeletedId };

export const SlowFullFoo = Template.bind({});
SlowFullFoo.args = {
  id: foo1Id,
  contextAdapter: new TestContextAdapter(SlowInterceptor),
};

export const NotFound = Template.bind({});
NotFound.args = { id: 'c6f97fae-1213-4be0-996f-4f20c7da7e65' };

// export const InvalidTypeNewEntity = Template.bind({});
// InvalidTypeNewEntity.args = {
//   entity: { type: 'InvalidType', isNew: true },
//   idPrefix: 'new-entity-123',
// };
