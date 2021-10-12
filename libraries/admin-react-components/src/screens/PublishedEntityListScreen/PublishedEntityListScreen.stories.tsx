import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React, { useState } from 'react';
import { LoadContextProvider } from '../../test/LoadContextProvider.js';
import type {
  PublishedEntityListScreenProps,
  PublishedEntityListScreenUrlQuery,
} from './PublishedEntityListScreen.js';
import { PublishedEntityListScreen } from './PublishedEntityListScreen.js';

type StoryProps = Omit<PublishedEntityListScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlQuery?: PublishedEntityListScreenUrlQuery;
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
  const [urlQuery, setUrlQuery] = useState<PublishedEntityListScreenUrlQuery>(
    initialUrlQuery ?? {}
  );
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
