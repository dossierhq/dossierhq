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
    style: { width: '100%', height: '100%' },
  },
  decorators: [
    (Story: React.FunctionComponent): JSX.Element => (
      <div style={{ position: 'absolute', inset: 0 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

const Template: Story<EntitySearchProps> = (args) => {
  return (
    <DataDataContext.Provider value={createContextValue()}>
      <EntitySearch {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
