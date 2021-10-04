import type { AdminClient, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { EntityList } from '../../index.js';
import { LoadContextProvider } from '../../test/LoadContextProvider.js';
import { createBackendAdminClient, ensureManyBarEntities } from '../../test/TestContextAdapter.js';
import type { EntityListProps } from './EntityList.js';

interface EntityListStoryProps extends EntityListProps {
  adminClient?: () => PromiseResult<AdminClient, ErrorType>;
}

const meta: Meta<EntityListStoryProps> = {
  title: 'Domain/EntityList',
  component: EntityList,
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
  return <EntityList {...props} />;
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
