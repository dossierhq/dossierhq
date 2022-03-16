import { buildUrlWithUrlQuery } from '@jonasb/datadata-core';
import { Text } from '@jonasb/datadata-design';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useMemo, useState } from 'react';
import type { EntitySearchStateUrlQuery } from '../..';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import type { EntityListScreenProps } from './EntityListScreen';
import { EntityListScreen } from './EntityListScreen';

type StoryProps = Omit<EntityListScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlQuery?: EntitySearchStateUrlQuery;
  showUrl: boolean;
};

const meta: Meta<StoryProps> = {
  title: 'Screens/EntityListScreen',
  component: EntityListScreen,
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
  args: { showUrl: false },
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper({ initialUrlQuery, showUrl, header, ...props }: StoryProps) {
  const [urlQuery, setUrlQuery] = useState<EntitySearchStateUrlQuery>(initialUrlQuery ?? {});
  const displayUrl = useMemo(() => decodeURI(buildUrlWithUrlQuery('/', urlQuery)), [urlQuery]);
  return (
    <LoadContextProvider>
      <EntityListScreen
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
    </LoadContextProvider>
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
