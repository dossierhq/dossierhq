import type { AdminClient, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { LoadContextProvider } from '../../test/LoadContextProvider.js';
import { createBackendAdminClient, ensureManyBarEntities } from '../../test/TestContextAdapter.js';
import type { EntitySearchProps } from './EntitySearch.js';
import { EntitySearch } from './EntitySearch.js';

interface EntitySearchStoryProps extends EntitySearchProps {
  adminClient?: () => PromiseResult<AdminClient, ErrorType>;
}

const meta: Meta<EntitySearchStoryProps> = {
  title: 'Domain/EntitySearch',
  component: EntitySearch,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: { className: 'dd-h-100' },
};
export default meta;

const Template: Story<EntitySearchStoryProps> = (args) => {
  return (
    <LoadContextProvider adminClient={args.adminClient}>
      <Wrapper {...args} />
    </LoadContextProvider>
  );
};

function Wrapper(props: EntitySearchStoryProps) {
  return <EntitySearch {...props} />;
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

export const ManyItemsSmallSize = Template.bind({});
ManyItemsSmallSize.args = {
  adminClient: async () => {
    const adminClient = createBackendAdminClient();
    const result = await ensureManyBarEntities(adminClient, 321);
    if (result.isError()) return result;
    return ok(adminClient);
  },
};
ManyItemsSmallSize.decorators = [
  (Story) => (
    <div
      style={{
        height: '200px',
        width: '100%',
        border: '1px solid black',
        marginTop: 'auto',
        marginBottom: 'auto',
      }}
    >
      <Story />
    </div>
  ),
];
