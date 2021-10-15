import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React, { useState } from 'react';
import type { EntitySearchStateUrlQuery } from '../../index.js';
import { LoadContextProvider } from '../../test/LoadContextProvider.js';
import type { EntityListScreenProps } from './EntityListScreen.js';
import { EntityListScreen } from './EntityListScreen.js';

type StoryProps = Omit<EntityListScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlQuery?: EntitySearchStateUrlQuery;
};

const meta: Meta<EntityListScreenProps> = {
  title: 'Published/Screens/EntityListScreen',
  component: EntityListScreen,
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
      <EntityListScreen {...props} urlQuery={urlQuery} onUrlQueryChanged={setUrlQuery} />
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
