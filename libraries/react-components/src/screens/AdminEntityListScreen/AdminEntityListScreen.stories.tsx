import type { AdminClientMiddleware, ClientContext } from '@dossierhq/core';
import { Text } from '@dossierhq/design';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import { CacheConfig } from '../../test/CacheConfig';
import { createSlowAdminMiddleware } from '../../test/TestContextAdapter';
import type { AdminEntityListScreenProps } from './AdminEntityListScreen';
import { AdminEntityListScreen } from './AdminEntityListScreen';

type StoryProps = Omit<AdminEntityListScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlSearchParams?: URLSearchParams;
  showUrl: boolean;
  ownCache: boolean;
  adminClientMiddleware?: AdminClientMiddleware<ClientContext>[];
};

const meta = {
  title: 'Screens/AdminEntityListScreen',
  component: Wrapper,
  argTypes: {
    onCreateEntity: {
      action: 'create-entity',
      table: { disable: true },
    },
    onOpenEntity: {
      action: 'open-entity',
      table: { disable: true },
    },
  },
  args: { showUrl: false, ownCache: true },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

function Wrapper({
  initialUrlSearchParams,
  ownCache,
  showUrl,
  header,
  adminClientMiddleware,
  ...props
}: StoryProps) {
  const [urlSearchParams, setUrlSearchParams] = useState<URLSearchParams>(
    initialUrlSearchParams ?? new URLSearchParams()
  );
  return (
    <CacheConfig ownCache={ownCache}>
      <AdminLoadContextProvider adminClientMiddleware={adminClientMiddleware}>
        <AdminEntityListScreen
          {...props}
          header={
            <>
              {showUrl ? (
                <Text textStyle="body2">entities?{urlSearchParams.toString()}</Text>
              ) : null}
              {header}
            </>
          }
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
    initialUrlSearchParams: new URLSearchParams({ query: '{"order":"name","text":"hello"}' }),
  },
};

export const InitialBoundingBoxQuery: Story = {
  args: {
    initialUrlSearchParams: new URLSearchParams({
      query:
        '{"boundingBox":{"minLat":55.59004909705666,"maxLat":55.63212782260112,"minLng":12.938149496912958,"maxLng":13.074276968836786}}',
    }),
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

export const SlowInitialTextNoMatch: Story = {
  args: {
    adminClientMiddleware: [createSlowAdminMiddleware()],
    initialUrlSearchParams: new URLSearchParams({
      query: '{"text":"xyz"}',
    }),
  },
};
