import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import type { LegacyEntityMapProps } from './LegacyEntityMap';
import { LegacyEntityMap } from './LegacyEntityMap';

const meta: Meta<LegacyEntityMapProps> = {
  title: 'Domain/LegacyEntityMap',
  component: LegacyEntityMap,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: {
    className: 'dd-position-fixed dd-inset-0',
  },
};
export default meta;

const Template: Story<LegacyEntityMapProps> = (args) => {
  return (
    <AdminLoadContextProvider>
      <LegacyEntityMap {...args} />
    </AdminLoadContextProvider>
  );
};

export const Normal = Template.bind({});
