import { Message } from '@dossierhq/design';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AdminLoadContextProvider } from '../test/AdminLoadContextProvider.js';
import { LoadFixtures } from '../test/LoadFixtures.js';

const meta = {
  title: 'Setup/LoadFixtures',
  component: Screen,
  parameters: { layout: 'center' },
} satisfies Meta<typeof Screen>;
export default meta;

type Story = StoryObj<typeof meta>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props {}

function Screen(_props: Props) {
  return (
    <AdminLoadContextProvider>
      <LoadFixtures>
        <Message>Fixtures are loaded</Message>
      </LoadFixtures>
    </AdminLoadContextProvider>
  );
}

export const Normal: Story = {};
