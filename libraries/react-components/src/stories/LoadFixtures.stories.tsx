import { Message } from '@jonasb/datadata-design';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { AdminLoadContextProvider } from '../test/AdminLoadContextProvider.js';
import { LoadFixtures } from '../test/LoadFixtures.js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface StoryProps {}

const meta: Meta<StoryProps> = {
  title: 'Setup/LoadFixtures',
  component: Screen,
  parameters: { layout: 'center' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Screen(args);
};

// eslint-disable-next-line no-empty-pattern
function Screen({}: StoryProps) {
  return (
    <AdminLoadContextProvider>
      <LoadFixtures>
        <Message>Fixtures are loaded</Message>
      </LoadFixtures>
    </AdminLoadContextProvider>
  );
}

export const Normal = Template.bind({});
