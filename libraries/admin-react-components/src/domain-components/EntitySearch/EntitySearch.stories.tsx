import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useEffect, useState } from 'react';
import type { DataDataContextValue } from '../..';
import { DataDataContext } from '../..';
import { createContextValue, createManyBarEntities } from '../../test/TestContextAdapter';
import type { EntitySearchProps } from './EntitySearch';
import { EntitySearch } from './EntitySearch';

interface EntitySearchStoryProps extends EntitySearchProps {
  contextValue?: () => Promise<DataDataContextValue>;
}

const meta: Meta<EntitySearchStoryProps> = {
  title: 'Domain/EntitySearch',
  component: EntitySearch,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: { className: 'h-100' },
};
export default meta;

const Template: Story<EntitySearchStoryProps> = (args) => {
  return <Wrapper {...args} />;
};

function Wrapper(props: EntitySearchStoryProps) {
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
      <EntitySearch {...props} />
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

export const ManyItemsSmallSize = Template.bind({});
ManyItemsSmallSize.args = {
  contextValue: async () => {
    const { contextValue, adminClient } = createContextValue();
    await createManyBarEntities(adminClient, 321);
    return contextValue;
  },
};
ManyItemsSmallSize.decorators = [
  (Story) => (
    <div
      style={{
        height: '200px',
        width: '100%',
        border: '1px solid black',
        marginTop: 'auto',
        marginBottom: 'auto',
      }}
    >
      <Story />
    </div>
  ),
];
