import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { PublishedLoadContextProvider } from '../../published/test/PublishedLoadContextProvider';
import { foo1Id } from '../../test/EntityFixtures';
import type { PublishedEntityDisplayScreenProps } from './PublishedEntityDisplayScreen';
import { PublishedEntityDisplayScreen } from './PublishedEntityDisplayScreen';

type StoryProps = Omit<PublishedEntityDisplayScreenProps, 'urlSearchParams'> & {
  initialUrlSearchParams?: URLSearchParams;
};

const meta = {
  title: 'Screens/PublishedEntityDisplayScreen',
  component: Wrapper,
  argTypes: {},
  args: {},
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

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

export const Normal: Story = {};

export const HeaderFooter: Story = {
  args: {
    header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
    footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  },
};

export const OpenFoo1Url: Story = {
  args: { initialUrlSearchParams: new URLSearchParams({ id: foo1Id }) },
};
