import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { LegacyEntityList } from '../..';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import type { LegacyEntityListProps } from './LegacyEntityList';

type EntityListStoryProps = LegacyEntityListProps;

const meta: Meta<EntityListStoryProps> = {
  title: 'Domain/LegacyEntityList',
  component: LegacyEntityList,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: {},
};
export default meta;

const Template: Story<EntityListStoryProps> = (args) => {
  return (
    <LoadContextProvider>
      <Wrapper {...args} />
    </LoadContextProvider>
  );
};

function Wrapper(props: EntityListStoryProps) {
  return <LegacyEntityList {...props} />;
}

export const Normal = Template.bind({});

// export const ManyItems = Template.bind({});
// ManyItems.args = {
//   adminClient: async () => {
//     const adminClient = createBackendAdminClient();
//     const result = await ensureManyBarEntities(adminClient, 321);
//     if (result.isError()) return result;
//     return ok(adminClient);
//   },
// };
