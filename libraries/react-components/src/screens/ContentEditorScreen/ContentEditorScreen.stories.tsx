import { NotificationContainer, Text } from '@dossierhq/design';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useMemo, useState } from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider.js';
import { CatalogEntities } from '../../test/CatalogEntities.js';
import type { ContentEditorScreenProps } from './ContentEditorScreen.js';
import { ContentEditorScreen } from './ContentEditorScreen.js';

type StoryProps = Omit<ContentEditorScreenProps, 'urlSearchParams' | 'onUrlSearchParamsChange'> & {
  initialUrlSearchParams?: URLSearchParams;
  showUrl: boolean;
};

const meta = {
  title: 'Screens/ContentEditorScreen',
  component: Wrapper,
  argTypes: {
    onEditorHasChangesChange: {
      action: 'editor-has-changes',
    },
  },
  args: { showUrl: false },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

function Wrapper({ initialUrlSearchParams, showUrl, header, ...props }: StoryProps) {
  const [urlSearchParams, onUrlSearchParamsChange] = useState<URLSearchParams>(
    initialUrlSearchParams ?? new URLSearchParams(),
  );
  const displayUrl = useMemo(() => decodeURI(urlSearchParams.toString()), [urlSearchParams]);
  return (
    <AdminLoadContextProvider>
      <NotificationContainer>
        <ContentEditorScreen
          {...props}
          header={
            <>
              {showUrl ? <Text textStyle="body2">/{displayUrl}</Text> : null}
              {header}
            </>
          }
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={onUrlSearchParamsChange}
        />
      </NotificationContainer>
    </AdminLoadContextProvider>
  );
}

export const Normal: Story = {};

export const HeaderFooter: Story = {
  args: {
    header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
    footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  },
};

export const NewStringsEntityUrl: Story = {
  args: {
    initialUrlSearchParams: new URLSearchParams({ new: `StringsEntity:${crypto.randomUUID()}` }),
  },
};

export const OpenStringPublishedMinimalUrl: Story = {
  args: {
    initialUrlSearchParams: new URLSearchParams({ id: CatalogEntities.Strings.publishedMinimal }),
  },
};

export const OpenAllBooleansUrl: Story = {
  args: {
    initialUrlSearchParams: urlFor(Object.values(CatalogEntities.Booleans)),
  },
};

export const OpenAllComponentsUrl: Story = {
  args: {
    initialUrlSearchParams: urlFor(Object.values(CatalogEntities.Components)),
  },
};

export const OpenAllEntitiesUrl: Story = {
  args: {
    initialUrlSearchParams: urlFor(Object.values(CatalogEntities.Entities)),
  },
};

export const OpenAllLocationsUrl: Story = {
  args: {
    initialUrlSearchParams: urlFor(Object.values(CatalogEntities.Locations)),
  },
};

export const OpenAllNumbersUrl: Story = {
  args: {
    initialUrlSearchParams: urlFor(Object.values(CatalogEntities.Numbers)),
  },
};

export const OpenAllRichTextsUrl: Story = {
  args: {
    initialUrlSearchParams: urlFor(Object.values(CatalogEntities.RichTexts)),
  },
};

export const OpenAllStringsUrl: Story = {
  args: {
    initialUrlSearchParams: urlFor(Object.values(CatalogEntities.Strings)),
  },
};

function urlFor(ids: string[]) {
  return new URLSearchParams(ids.map((id) => ['id', id]));
}
