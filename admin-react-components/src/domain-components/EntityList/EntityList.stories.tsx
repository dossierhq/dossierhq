import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityList } from './EntityList';
import type { EntityListProps } from './EntityList';
import { createContextValue } from '../../test/TestContextAdapter';

export default {
  title: 'Domain/EntityList',
  component: EntityList,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: {},
};

const Template: Story<EntityListProps> = (args) => {
  return (
    <DataDataContext.Provider value={createContextValue()}>
      <EntityList {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
