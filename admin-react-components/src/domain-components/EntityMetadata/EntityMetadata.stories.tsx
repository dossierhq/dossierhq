import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { DataDataContext } from '../..';
import { EntityMetadata } from './EntityMetadata';
import type { EntityMetadataProps } from './EntityMetadata';
import TestContextValue from '../../test/TestContextValue';
import { foo1Id, fooDeletedId } from '../../test/EntityFixtures';

const defaultArgs: Partial<EntityMetadataProps> = {};

export default {
  title: 'Domain/EntityMetadata',
  component: EntityMetadata,
  args: defaultArgs,
};

const Template: Story<EntityMetadataProps> = (args) => {
  return (
    <DataDataContext.Provider value={new TestContextValue()}>
      <EntityMetadata {...args} />
    </DataDataContext.Provider>
  );
};

export const Normal = Template.bind({});
Normal.args = { entityId: foo1Id };

export const Deleted = Template.bind({});
Deleted.args = { entityId: fooDeletedId };
