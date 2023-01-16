import type { AdminClientMiddleware, ClientContext } from '@dossierhq/core';
import { buildUrlWithUrlQuery } from '@dossierhq/core';
import { Text } from '@jonasb/datadata-design';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useMemo, useState } from 'react';
import type { EntitySearchStateUrlQuery } from '../..';
import { CacheConfig } from '../../test/CacheConfig';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import { createSlowAdminMiddleware } from '../../test/TestContextAdapter';
import type { AdminEntityListScreenProps } from './AdminEntityListScreen';
import { AdminEntityListScreen } from './AdminEntityListScreen';

type StoryProps = Omit<AdminEntityListScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlQuery?: EntitySearchStateUrlQuery;
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
  const [urlQuery, setUrlQuery] = useState<EntitySearchStateUrlQuery>(initialUrlQuery ?? {});
  const displayUrl = useMemo(() => decodeURI(buildUrlWithUrlQuery('/', urlQuery)), [urlQuery]);
  return (
    <CacheConfig ownCache={ownCache}>
      <AdminLoadContextProvider adminClientMiddleware={adminClientMiddleware}>
        <AdminEntityListScreen
          {...props}
          header={
            <>
              {showUrl ? <Text textStyle="body2">{displayUrl}</Text> : null}
              {header}
            </>
          }
          urlQuery={urlQuery}
          onUrlQueryChanged={setUrlQuery}
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
