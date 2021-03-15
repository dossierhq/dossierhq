import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityMetadata } from './EntityMetadata';
import type { EntityMetadataProps } from './EntityMetadata';
import { createContextValue } from '../../test/TestContextAdapter';
import { foo1Id, fooDeletedId } from '../../test/EntityFixtures';

const meta: Meta<EntityMetadataProps> = {
  title: 'Domain/EntityMetadata',
  component: EntityMetadata,
  args: {},
};
export default meta;

const Template: Story<EntityMetadataProps> = (args) => {
  return (
    <DataDataContext.Provider value={createContextValue()}>
      <EntityMetadata {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
Normal.args = { entityId: foo1Id };

export const Deleted = Template.bind({});
Deleted.args = { entityId: fooDeletedId };
