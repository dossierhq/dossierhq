import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useState } from 'react';
import { PublishedLoadContextProvider } from '../../published/test/PublishedLoadContextProvider';
import { foo1Id } from '../../test/EntityFixtures';
import type { PublishedEntityDisplayScreenProps } from './PublishedEntityDisplayScreen';
import { PublishedEntityDisplayScreen } from './PublishedEntityDisplayScreen';

type StoryProps = Omit<PublishedEntityDisplayScreenProps, 'urlSearchParams'> & {
  initialUrlSearchParams?: URLSearchParams;
};

const meta: Meta<PublishedEntityDisplayScreenProps> = {
  title: 'Screens/PublishedEntityDisplayScreen',
  component: PublishedEntityDisplayScreen,
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
      <PublishedEntityDisplayScreen
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
