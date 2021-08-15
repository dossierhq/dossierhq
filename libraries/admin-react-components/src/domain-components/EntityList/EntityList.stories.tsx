import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useEffect, useState } from 'react';
import type { DataDataContextValue } from '../..';
import { DataDataContext, EntityList } from '../..';
import { createContextValue, createManyBarEntities } from '../../test/TestContextAdapter';
import type { EntityListProps } from './EntityList';

interface EntityListStoryProps extends EntityListProps {
  contextValue?: () => Promise<DataDataContextValue>;
}

const meta: Meta<EntityListStoryProps> = {
  title: 'Domain/EntityList',
  component: EntityList,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: {},
};
export default meta;

const Template: Story<EntityListStoryProps> = (args) => {
  return <Wrapper {...args} />;
};

function Wrapper(props: EntityListStoryProps) {
  const contextValueFactory = props?.contextValue;
  const [contextValue, setContextValue] = useState(
    contextValueFactory ? null : createContextValue().contextValue
  );

  useEffect(() => {
    contextValueFactory?.().then(setContextValue);
  }, [contextValueFactory]);

  if (!contextValue) {
    return <></>;
  }
  return (
    <DataDataContext.Provider value={contextValue}>
      <EntityList {...props} />
    </DataDataContext.Provider>
  );
}

export const Normal = Template.bind({});

export const ManyItems = Template.bind({});
ManyItems.args = {
  contextValue: async () => {
    const { contextValue, adminClient } = createContextValue();
    await createManyBarEntities(adminClient, 321);
    return contextValue;
  },
};
