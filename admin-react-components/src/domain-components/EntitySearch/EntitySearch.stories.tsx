import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntitySearch } from './EntitySearch';
import type { EntitySearchProps } from './EntitySearch';
import { createContextValue } from '../../test/TestContextAdapter';

const meta: Meta<EntitySearchProps> = {
  title: 'Domain/EntitySearch',
  component: EntitySearch,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: {
    className: 'position-fixed inset-0',
  },
};
export default meta;

const Template: Story<EntitySearchProps> = (args) => {
  return (
    <DataDataContext.Provider value={createContextValue().contextValue}>
      <EntitySearch {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
