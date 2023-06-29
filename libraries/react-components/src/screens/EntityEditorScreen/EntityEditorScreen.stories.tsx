import { NotificationContainer, Text } from '@dossierhq/design';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useMemo, useState } from 'react';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import type { EntityEditorScreenProps } from './EntityEditorScreen';
import { EntityEditorScreen } from './EntityEditorScreen';

type StoryProps = Omit<EntityEditorScreenProps, 'urlSearchParams' | 'onUrlSearchParamsChange'> & {
  initialUrlSearchParams?: URLSearchParams;
  showUrl: boolean;
};

const meta = {
  title: 'Screens/EntityEditorScreen',
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
    initialUrlSearchParams ?? new URLSearchParams()
  );
  const displayUrl = useMemo(() => decodeURI(urlSearchParams.toString()), [urlSearchParams]);
  return (
    <AdminLoadContextProvider>
      <NotificationContainer>
        <EntityEditorScreen
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
    initialUrlSearchParams: new URLSearchParams({ id: '3d496031-5346-5637-bded-3839baa64a80' }),
  },
};
