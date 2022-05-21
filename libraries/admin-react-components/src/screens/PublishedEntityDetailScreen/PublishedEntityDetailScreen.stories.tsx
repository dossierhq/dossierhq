import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { foo1Id } from '../../test/EntityFixtures';
import { PublishedLoadContextProvider } from '../../published/test/PublishedLoadContextProvider';
import type { PublishedEntityDetailScreenProps } from './PublishedEntityDetailScreen';
import { PublishedEntityDetailScreen } from './PublishedEntityDetailScreen';

type StoryProps = PublishedEntityDetailScreenProps;

const meta: Meta<PublishedEntityDetailScreenProps> = {
  title: 'Screens/PublishedEntityDetailScreen',
  component: PublishedEntityDetailScreen,
  argTypes: {},
  args: { reference: { id: foo1Id } },
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper(props: StoryProps) {
  return (
    <PublishedLoadContextProvider>
      <PublishedEntityDetailScreen {...props} />
    </PublishedLoadContextProvider>
  );
}

export const Normal = Template.bind({});

export const HeaderFooter = Template.bind({});
HeaderFooter.args = {
  header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
};
