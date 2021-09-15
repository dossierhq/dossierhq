import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityMap } from './EntityMap';
import type { EntityMapProps } from './EntityMap';
import { createContextValue } from '../../test/TestContextAdapter';

const meta: Meta<EntityMapProps> = {
  title: 'Domain/EntityMap',
  component: EntityMap,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: {
    className: 'dd-position-fixed dd-inset-0',
  },
};
export default meta;

const Template: Story<EntityMapProps> = (args) => {
  return (
    <DataDataContext.Provider value={createContextValue().contextValue}>
      <EntityMap {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
