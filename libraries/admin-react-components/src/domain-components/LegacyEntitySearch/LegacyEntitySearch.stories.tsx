import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import type { LegacyEntitySearchProps } from './LegacyEntitySearch';
import { LegacyEntitySearch } from './LegacyEntitySearch';

type EntitySearchStoryProps = LegacyEntitySearchProps;

const meta: Meta<EntitySearchStoryProps> = {
  title: 'Domain/LegacyEntitySearch',
  component: LegacyEntitySearch,
  argTypes: { onEntityClick: { action: 'entity-click' } },
  args: { className: 'dd-h-100' },
};
export default meta;

const Template: Story<EntitySearchStoryProps> = (args) => {
  return (
    <AdminLoadContextProvider>
      <Wrapper {...args} />
    </AdminLoadContextProvider>
  );
};

function Wrapper(props: EntitySearchStoryProps) {
  return <LegacyEntitySearch {...props} />;
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

// export const ManyItemsSmallSize = Template.bind({});
// ManyItemsSmallSize.args = {
//   adminClient: async () => {
//     const adminClient = createBackendAdminClient();
//     const result = await ensureManyBarEntities(adminClient, 321);
//     if (result.isError()) return result;
//     return ok(adminClient);
//   },
// };
// ManyItemsSmallSize.decorators = [
//   (Story) => (
//     <div
//       style={{
//         height: '200px',
//         width: '100%',
//         border: '1px solid black',
//         marginTop: 'auto',
//         marginBottom: 'auto',
//       }}
//     >
//       <Story />
//     </div>
//   ),
// ];
