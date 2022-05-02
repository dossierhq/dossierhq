import { NotificationContainer, Text } from '@jonasb/datadata-design';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useMemo, useState } from 'react';
import { foo1Id } from '../../test/EntityFixtures';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import type { AdminEntityEditorScreenProps } from './AdminEntityEditorScreen';
import { AdminEntityEditorScreen } from './AdminEntityEditorScreen';

type StoryProps = Omit<
  AdminEntityEditorScreenProps,
  'urlSearchParams' | 'onUrlSearchParamsChange'
> & {
  initialUrlSearchParams?: URLSearchParams;
  showUrl: boolean;
};

const meta: Meta<StoryProps> = {
  title: 'Screens/AdminEntityEditorScreen',
  component: AdminEntityEditorScreen,
  argTypes: {},
  args: { showUrl: false },
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper({
  initialUrlSearchParams: initialUrlQuery,
  showUrl,
  header,
  ...props
}: StoryProps) {
  const [urlSearchParams, onUrlSearchParamsChange] = useState<URLSearchParams>(
    initialUrlQuery ?? new URLSearchParams()
  );
  const displayUrl = useMemo(() => decodeURI(urlSearchParams.toString()), [urlSearchParams]);
  return (
    <LoadContextProvider>
      <NotificationContainer>
        <AdminEntityEditorScreen
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
    </LoadContextProvider>
  );
}

export const Normal = Template.bind({});

export const HeaderFooter = Template.bind({});
HeaderFooter.args = {
  header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
};

export const NewFooUrl = Template.bind({});
NewFooUrl.args = { initialUrlSearchParams: new URLSearchParams({ type: 'Foo' }) };

export const FooUrl = Template.bind({});
FooUrl.args = { initialUrlSearchParams: new URLSearchParams({ id: foo1Id }) };
