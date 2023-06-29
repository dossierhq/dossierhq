import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { PublishedLoadContextProvider } from '../../published/test/PublishedLoadContextProvider';
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

export const OpenStringPublishedMinimalUrl: Story = {
  args: {
    initialUrlSearchParams: new URLSearchParams({ id: '3d496031-5346-5637-bded-3839baa64a80' }),
  },
};
