import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityList } from './EntityList';
import type { EntityListProps } from './EntityList';
import TestContextValue from '../../test/TestContextValue';

export default {
  title: 'Domain/EntityList',
  component: EntityList,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: {},
};

const Template: Story<EntityListProps> = (args) => {
  return (
    <DataDataContext.Provider value={new TestContextValue()}>
      <EntityList {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
