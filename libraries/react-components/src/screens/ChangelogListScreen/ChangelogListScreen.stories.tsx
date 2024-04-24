import type { DossierClientMiddleware, ClientContext } from '@dossierhq/core';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider.js';
import { CacheConfig } from '../../test/CacheConfig.js';
import { createSlowAdminMiddleware } from '../../test/TestContextAdapter.js';
import { ChangelogListScreen, type ChangelogListScreenProps } from './ChangelogListScreen.js';

type StoryProps = Omit<ChangelogListScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlSearchParams?: URLSearchParams;
  ownCache: boolean;
  adminClientMiddleware?: DossierClientMiddleware<ClientContext>[];
};

const meta = {
  title: 'Screens/ChangelogListScreen',
  component: Wrapper,
  argTypes: {},
  args: { ownCache: true },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

function Wrapper({
  initialUrlSearchParams,
  ownCache,
  adminClientMiddleware,
  ...props
}: StoryProps) {
  const [urlSearchParams, setUrlSearchParams] = useState<URLSearchParams>(
    initialUrlSearchParams ?? new URLSearchParams(),
  );
  return (
    <CacheConfig ownCache={ownCache}>
      <AdminLoadContextProvider adminClientMiddleware={adminClientMiddleware}>
        <ChangelogListScreen
          {...props}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setUrlSearchParams}
        />
      </AdminLoadContextProvider>
    </CacheConfig>
  );
}

export const Normal: Story = {};

export const HeaderFooter: Story = {
  args: {
    header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
    footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  },
};

export const InitialQuery: Story = {
  args: {
    initialUrlSearchParams: new URLSearchParams({ query: '{"reverse":false}' }),
  },
};

export const Slow: Story = {
  args: {
    adminClientMiddleware: [createSlowAdminMiddleware()],
  },
};

export const SlowUsingSharedCache: Story = {
  args: {
    ownCache: false,
    adminClientMiddleware: [createSlowAdminMiddleware()],
  },
};
