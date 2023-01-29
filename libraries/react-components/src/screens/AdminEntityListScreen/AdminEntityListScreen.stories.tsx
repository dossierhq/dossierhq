import type { AdminClientMiddleware, ClientContext } from '@dossierhq/core';
import { Text } from '@dossierhq/design';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useState } from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import { CacheConfig } from '../../test/CacheConfig';
import { createSlowAdminMiddleware } from '../../test/TestContextAdapter';
import type { AdminEntityListScreenProps } from './AdminEntityListScreen';
import { AdminEntityListScreen } from './AdminEntityListScreen';

type StoryProps = Omit<AdminEntityListScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlQuery?: URLSearchParams;
  showUrl: boolean;
  ownCache: boolean;
  adminClientMiddleware?: AdminClientMiddleware<ClientContext>[];
};

const meta: Meta<StoryProps> = {
  title: 'Screens/AdminEntityListScreen',
  component: AdminEntityListScreen,
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
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper({
  initialUrlQuery,
  ownCache,
  showUrl,
  header,
  adminClientMiddleware,
  ...props
}: StoryProps) {
  const [urlSearchParams, setUrlSearchParams] = useState<URLSearchParams>(
    initialUrlQuery ?? new URLSearchParams()
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

export const Normal = Template.bind({});

export const HeaderFooter = Template.bind({});
HeaderFooter.args = {
  header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
};

export const InitialQuery = Template.bind({});
InitialQuery.args = {
  initialUrlQuery: { query: '{"order":"name","text":"hello"}' },
};

export const InitialBoundingBoxQuery = Template.bind({});
InitialBoundingBoxQuery.args = {
  initialUrlQuery: {
    query:
      '{"boundingBox":{"minLat":55.59004909705666,"maxLat":55.63212782260112,"minLng":12.938149496912958,"maxLng":13.074276968836786}}',
  },
};

export const Slow = Template.bind({});
Slow.args = {
  adminClientMiddleware: [createSlowAdminMiddleware()],
};

export const SlowUsingSharedCache = Template.bind({});
SlowUsingSharedCache.args = {
  ownCache: false,
  adminClientMiddleware: [createSlowAdminMiddleware()],
};

export const SlowInitialTextNoMatch = Template.bind({});
SlowInitialTextNoMatch.args = {
  adminClientMiddleware: [createSlowAdminMiddleware()],
  initialUrlQuery: { query: '{"text":"there-are-no-matches-for-this"}' },
};
