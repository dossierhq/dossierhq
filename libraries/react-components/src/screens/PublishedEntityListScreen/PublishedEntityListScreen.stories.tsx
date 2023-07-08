import type { ClientContext, PublishedClientMiddleware } from '@dossierhq/core';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { PublishedLoadContextProvider } from '../../published/test/PublishedLoadContextProvider';
import { CacheConfig } from '../../test/CacheConfig';
import { createSlowPublishedMiddleware } from '../../test/TestContextAdapter';
import type { PublishedEntityListScreenProps } from './PublishedEntityListScreen';
import { PublishedEntityListScreen } from './PublishedEntityListScreen';

type StoryProps = Omit<PublishedEntityListScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlSearchParams?: URLSearchParams;
  ownCache: boolean;
  publishedClientMiddleware?: PublishedClientMiddleware<ClientContext>[];
};

const meta = {
  title: 'Screens/PublishedEntityListScreen',
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
  publishedClientMiddleware,
  ...props
}: StoryProps) {
  const [urlSearchParams, setUrlSearchParams] = useState<URLSearchParams>(
    initialUrlSearchParams ?? new URLSearchParams(),
  );
  return (
    <CacheConfig ownCache={ownCache}>
      <PublishedLoadContextProvider publishedClientMiddleware={publishedClientMiddleware}>
        <PublishedEntityListScreen
          {...props}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setUrlSearchParams}
        />
      </PublishedLoadContextProvider>
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
    publishedClientMiddleware: [createSlowPublishedMiddleware()],
  },
};

export const SlowUsingSharedCache: Story = {
  args: {
    ownCache: false,
    publishedClientMiddleware: [createSlowPublishedMiddleware()],
  },
};

export const SlowInitialTextNoMatch: Story = {
  args: {
    publishedClientMiddleware: [createSlowPublishedMiddleware()],
    initialUrlSearchParams: new URLSearchParams({
      query: '{"text":"there-are-no-matches-for-this"}',
    }),
  },
};
