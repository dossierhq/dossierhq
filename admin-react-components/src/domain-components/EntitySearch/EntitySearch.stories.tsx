import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntitySearch } from './EntitySearch';
import type { EntitySearchProps } from './EntitySearch';
import TestContextValue from '../../test/TestContextValue';

const defaultArgs: Partial<EntitySearchProps> = {
  style: { width: '100%', height: '100%' },
};

export default {
  title: 'Domain/EntitySearch',
  component: EntitySearch,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: defaultArgs,
  decorators: [
    (Story: React.FunctionComponent): JSX.Element => (
      <div style={{ position: 'absolute', inset: 0 }}>
        <Story />
      </div>
    ),
  ],
};

const Template: Story<EntitySearchProps> = (args) => {
  return (
    <DataDataContext.Provider value={new TestContextValue()}>
      <EntitySearch {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
