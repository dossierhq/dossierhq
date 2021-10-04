import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { LoadContextProvider } from '../../test/LoadContextProvider.js';
import type { EntityMapProps } from './EntityMap.js';
import { EntityMap } from './EntityMap.js';

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
    <LoadContextProvider>
      <EntityMap {...args} />
    </LoadContextProvider>
  );
};

export const Normal = Template.bind({});
