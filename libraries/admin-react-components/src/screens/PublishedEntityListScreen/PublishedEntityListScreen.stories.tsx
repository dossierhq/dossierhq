import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useState } from 'react';
import type { EntitySearchStateUrlQuery } from '../../published';
import { LoadContextProvider } from '../../published/test/LoadContextProvider';
import type { PublishedEntityListScreenProps } from './PublishedEntityListScreen';
import { PublishedEntityListScreen } from './PublishedEntityListScreen';

type StoryProps = Omit<PublishedEntityListScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlQuery?: EntitySearchStateUrlQuery;
};

const meta: Meta<PublishedEntityListScreenProps> = {
  title: 'Screens/PublishedEntityListScreen',
  component: PublishedEntityListScreen,
  argTypes: {
    onOpenEntity: { action: 'open-entity' },
  },
  args: {},
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper({ initialUrlQuery, ...props }: StoryProps) {
  const [urlQuery, setUrlQuery] = useState<EntitySearchStateUrlQuery>(initialUrlQuery ?? {});
  return (
    <LoadContextProvider>
      <PublishedEntityListScreen {...props} urlQuery={urlQuery} onUrlQueryChanged={setUrlQuery} />
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
