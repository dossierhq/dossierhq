import type { Schema } from '@datadata/core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useReducer } from 'react';
import type { DataDataContextValue, EntityEditorSelector } from '../..';
import { DataDataContext } from '../..';
import { EntityEditorOverview } from './EntityEditorOverview';
import type { EntityEditorOverviewProps } from './EntityEditorOverview';
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
import { EntityLoader } from '../EntityEditor/EntityEditor';

interface StoryProps extends EntityEditorOverviewProps {
  contextAdapter?: TestContextAdapter;
  entitySelectors?: EntityEditorSelector[];
}

const meta: Meta<StoryProps> = {
  title: 'Domain/EntityEditorOverview',
  component: EntityEditorOverview,
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  const contextValue = createContextValue(args.contextAdapter);
  return (
    <DataDataContext.Provider value={contextValue}>
      <Wrapper {...args} schema={contextValue.schema} useEntity={contextValue.useEntity} />
    </DataDataContext.Provider>
  );
};

function Wrapper({
  className,
  entitySelectors,
  schema,
  useEntity,
}: {
  className?: string;
  entitySelectors?: EntityEditorSelector[];
  schema: Schema;
  useEntity: DataDataContextValue['useEntity'];
}) {
  const [editorState, dispatchEditorState] = useReducer(
    reduceEntityEditorState,
    { schema, actions: entitySelectors?.map((x) => new AddEntityDraftAction(x)) },
    initializeEntityEditorState
  );
  // EntityLoader is needed since we don't use any EntityEditor here

  return (
    <>
      {entitySelectors?.map(({ id }) =>
        id ? <EntityLoader key={id} entityId={id} {...{ useEntity, dispatchEditorState }} /> : null
      )}
      <EntityEditorOverview {...{ className, editorState, dispatchEditorState }} />
    </>
  );
}

export const Normal = Template.bind({});
Normal.args = {
  entitySelectors: [{ id: foo1Id }, { id: bar1Id }, { id: bar2Id }, { id: fooDeletedId }],
};

export const Slow = Template.bind({});
Slow.args = {
  entitySelectors: [{ id: foo1Id }, { id: bar1Id }, { id: bar2Id }, { id: fooDeletedId }],
  contextAdapter: new TestContextAdapter(SlowInterceptor),
};
