import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityMap } from './EntityMap';
import type { EntityMapProps } from './EntityMap';
import TestContextValue from '../../test/TestContextValue';

const defaultArgs: Partial<EntityMapProps> = {
  style: { width: '300px', height: '300px' },
};

export default {
  title: 'Domain/EntityMap',
  component: EntityMap,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: defaultArgs,
};

const Template: Story<EntityMapProps> = (args) => {
  return (
    <DataDataContext.Provider value={new TestContextValue()}>
      <EntityMap {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
