import { buildUrlWithUrlQuery } from '@jonasb/datadata-core';
import { Text } from '@jonasb/datadata-design';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useMemo, useState } from 'react';
import type { EntityEditorStateUrlQuery } from '../../reducers/EntityEditorReducer/EntityEditorUrlSynchronizer';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import type { AdminEntityEditorScreenProps } from './AdminEntityEditorScreen';
import { AdminEntityEditorScreen } from './AdminEntityEditorScreen';

type StoryProps = Omit<AdminEntityEditorScreenProps, 'urlQuery' | 'onUrlQueryChanged'> & {
  initialUrlQuery?: EntityEditorStateUrlQuery;
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

function Wrapper({ initialUrlQuery, showUrl, header, ...props }: StoryProps) {
  const [urlQuery, setUrlQuery] = useState<EntityEditorStateUrlQuery>(initialUrlQuery ?? {});
  const displayUrl = useMemo(() => decodeURI(buildUrlWithUrlQuery('/', urlQuery)), [urlQuery]);
  return (
    <LoadContextProvider>
      <AdminEntityEditorScreen
        {...props}
        header={
          <>
            {showUrl ? <Text textStyle="body2">{displayUrl}</Text> : null}
            {header}
          </>
        }
        urlQuery={urlQuery}
        onUrlQueryChange={setUrlQuery}
      />
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
NewFooUrl.args = { initialUrlQuery: { type: '"Foo"' } };
