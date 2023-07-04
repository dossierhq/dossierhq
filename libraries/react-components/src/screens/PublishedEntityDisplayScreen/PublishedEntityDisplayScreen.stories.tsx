import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { PublishedLoadContextProvider } from '../../published/test/PublishedLoadContextProvider';
import { CatalogEntities } from '../../test/CatalogEntities.js';
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

export const OpenPublishedBooleans: Story = {
  args: {
    initialUrlSearchParams: urlFor([
      CatalogEntities.Booleans.publishedMinimal,
      CatalogEntities.Booleans.publishedInvalid,
    ]),
  },
};

export const OpenPublishedEntities: Story = {
  args: {
    initialUrlSearchParams: urlFor([
      CatalogEntities.Entities.publishedMinimal,
      CatalogEntities.Entities.publishedInvalid,
    ]),
  },
};

export const OpenPublishedLocations: Story = {
  args: {
    initialUrlSearchParams: urlFor([
      CatalogEntities.Locations.publishedMinimal,
      CatalogEntities.Locations.publishedInvalid,
    ]),
  },
};

export const OpenNumbersEntities: Story = {
  args: {
    initialUrlSearchParams: urlFor([
      CatalogEntities.Numbers.publishedMinimal,
      CatalogEntities.Numbers.publishedInvalid,
    ]),
  },
};

export const OpenRichTextsEntities: Story = {
  args: {
    initialUrlSearchParams: urlFor([
      CatalogEntities.RichTexts.publishedMinimal,
      CatalogEntities.RichTexts.publishedInvalid,
    ]),
  },
};

export const OpenStringsEntities: Story = {
  args: {
    initialUrlSearchParams: urlFor([
      CatalogEntities.Strings.publishedMinimal,
      CatalogEntities.Strings.publishedInvalid,
    ]),
  },
};

export const OpenValueItemsEntities: Story = {
  args: {
    initialUrlSearchParams: urlFor([
      CatalogEntities.ValueItems.publishedMinimal,
      CatalogEntities.ValueItems.publishedInvalid,
    ]),
  },
};

function urlFor(ids: string[]) {
  return new URLSearchParams(ids.map((id) => ['id', id]));
}
