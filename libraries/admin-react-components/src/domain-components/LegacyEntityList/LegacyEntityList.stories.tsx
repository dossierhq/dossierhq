import type { AdminClient, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { LegacyEntityList } from '../..';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import { createBackendAdminClient, ensureManyBarEntities } from '../../test/TestContextAdapter';
import type { LegacyEntityListProps } from './LegacyEntityList';

interface EntityListStoryProps extends LegacyEntityListProps {
  adminClient?: () => PromiseResult<AdminClient, ErrorType>;
}

const meta: Meta<EntityListStoryProps> = {
  title: 'Domain/LegacyEntityList',
  component: LegacyEntityList,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: {},
};
export default meta;

const Template: Story<EntityListStoryProps> = (args) => {
  return (
    <LoadContextProvider adminClient={args.adminClient}>
      <Wrapper {...args} />
    </LoadContextProvider>
  );
};

function Wrapper(props: EntityListStoryProps) {
  return <LegacyEntityList {...props} />;
}

export const Normal = Template.bind({});

export const ManyItems = Template.bind({});
ManyItems.args = {
  adminClient: async () => {
    const adminClient = createBackendAdminClient();
    const result = await ensureManyBarEntities(adminClient, 321);
    if (result.isError()) return result;
    return ok(adminClient);
  },
};
