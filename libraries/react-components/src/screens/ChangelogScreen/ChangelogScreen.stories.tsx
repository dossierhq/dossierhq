import type { AdminClientMiddleware, ClientContext } from '@dossierhq/core';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import { CacheConfig } from '../../test/CacheConfig';
import { createSlowAdminMiddleware } from '../../test/TestContextAdapter';
import { ChangelogScreen, type ChangelogScreenProps } from './ChangelogScreen.js';

type StoryProps = Omit<ChangelogScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlSearchParams?: URLSearchParams;
  ownCache: boolean;
  adminClientMiddleware?: AdminClientMiddleware<ClientContext>[];
};

const meta = {
  title: 'Screens/ChangelogScreen',
  component: Wrapper,
  argTypes: {
    onOpenEntity: { action: 'open-entity' },
  },
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
        <ChangelogScreen
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
