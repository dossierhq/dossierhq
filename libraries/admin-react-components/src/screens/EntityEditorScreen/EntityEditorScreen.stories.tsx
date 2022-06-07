import { NotificationContainer, Text } from '@jonasb/datadata-design';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useMemo, useState } from 'react';
import { foo1Id } from '../../test/EntityFixtures';
import { AdminLoadContextProvider } from '../../test/AdminLoadContextProvider';
import type { EntityEditorScreenProps } from './EntityEditorScreen';
import { EntityEditorScreen } from './EntityEditorScreen';

type StoryProps = Omit<EntityEditorScreenProps, 'urlSearchParams' | 'onUrlSearchParamsChange'> & {
  initialUrlSearchParams?: URLSearchParams;
  showUrl: boolean;
};

const meta: Meta<StoryProps> = {
  title: 'Screens/EntityEditorScreen',
  component: EntityEditorScreen,
  argTypes: {
    onEditorHasChangesChange: {
      action: 'editor-has-changes',
    },
  },
  args: { showUrl: false },
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

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

export const Normal = Template.bind({});

export const HeaderFooter = Template.bind({});
HeaderFooter.args = {
  header: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
  footer: <div style={{ height: 50, backgroundColor: 'papayawhip' }} />,
};

export const NewFooUrl = Template.bind({});
NewFooUrl.args = {
  initialUrlSearchParams: new URLSearchParams({ new: `Foo:${crypto.randomUUID()}` }),
};

export const OpenFoo1Url = Template.bind({});
OpenFoo1Url.args = { initialUrlSearchParams: new URLSearchParams({ id: foo1Id }) };
