import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useState } from 'react';
import { foo1Id } from '../../test/EntityFixtures';
import { PublishedLoadContextProvider } from '../../published/test/PublishedLoadContextProvider';
import type { PublishedEntityDetailScreenProps } from './PublishedEntityDetailScreen';
import { PublishedEntityDetailScreen } from './PublishedEntityDetailScreen';

type StoryProps = Omit<PublishedEntityDetailScreenProps, 'urlSearchParams'> & {
  initialUrlSearchParams?: URLSearchParams;
};

const meta: Meta<PublishedEntityDetailScreenProps> = {
  title: 'Screens/PublishedEntityDetailScreen',
  component: PublishedEntityDetailScreen,
  argTypes: {},
  args: {},
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper({ initialUrlSearchParams, ...props }: StoryProps) {
  const [urlSearchParams, onUrlSearchParamsChange] = useState<URLSearchParams>(
    initialUrlSearchParams ?? new URLSearchParams()
  );

  return (
    <PublishedLoadContextProvider>
      <PublishedEntityDetailScreen
        {...props}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
      />
    </PublishedLoadContextProvider>
  );
}

export const Normal = Template.bind({});

export const HeaderFooter = Template.bind({});
HeaderFooter.args = {
  header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
};

export const OpenFoo1Url = Template.bind({});
OpenFoo1Url.args = { initialUrlSearchParams: new URLSearchParams({ id: foo1Id }) };
