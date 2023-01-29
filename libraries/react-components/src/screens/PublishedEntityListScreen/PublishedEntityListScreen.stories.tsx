import type { ClientContext, PublishedClientMiddleware } from '@dossierhq/core';
import type { Meta, Story } from '@storybook/react/types-6-0';
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

const meta: Meta<StoryProps> = {
  title: 'Screens/PublishedEntityListScreen',
  component: PublishedEntityListScreen,
  argTypes: {
    onOpenEntity: { action: 'open-entity' },
  },
  args: { ownCache: true },
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper({
  initialUrlSearchParams,
  ownCache,
  publishedClientMiddleware,
  ...props
}: StoryProps) {
  const [urlSearchParams, setUrlSearchParams] = useState<URLSearchParams>(
    initialUrlSearchParams ?? new URLSearchParams()
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

export const Normal = Template.bind({});

export const HeaderFooter = Template.bind({});
HeaderFooter.args = {
  header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
};

export const InitialQuery = Template.bind({});
InitialQuery.args = {
  initialUrlSearchParams: { query: '{"order":"name","text":"hello"}' },
};

export const InitialBoundingBoxQuery = Template.bind({});
InitialBoundingBoxQuery.args = {
  initialUrlSearchParams: {
    query:
      '{"boundingBox":{"minLat":55.59004909705666,"maxLat":55.63212782260112,"minLng":12.938149496912958,"maxLng":13.074276968836786}}',
  },
};

export const Slow = Template.bind({});
Slow.args = {
  publishedClientMiddleware: [createSlowPublishedMiddleware()],
};

export const SlowUsingSharedCache = Template.bind({});
SlowUsingSharedCache.args = {
  ownCache: false,
  publishedClientMiddleware: [createSlowPublishedMiddleware()],
};

export const SlowInitialTextNoMatch = Template.bind({});
SlowInitialTextNoMatch.args = {
  publishedClientMiddleware: [createSlowPublishedMiddleware()],
  initialUrlSearchParams: { query: '{"text":"there-are-no-matches-for-this"}' },
};
