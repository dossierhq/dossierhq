import { buildUrlWithUrlQuery } from '@jonasb/datadata-core';
import { Text } from '@jonasb/datadata-design';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useCallback, useMemo, useState } from 'react';
import type { LegacyEntityEditorSelector } from '../..';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import type { EntityEditorScreenProps } from './LegacyEntityEditorScreen';
import { LegacyEntityEditorScreen } from './LegacyEntityEditorScreen';

interface EntityEditorUrlQuery {
  type?: string;
  ids?: string;
}

type StoryProps = EntityEditorScreenProps & {
  initialUrlQuery?: EntityEditorUrlQuery;
  showUrl: boolean;
};

const meta: Meta<StoryProps> = {
  title: 'Screens/LegacyEntityEditorScreen',
  component: LegacyEntityEditorScreen,
  argTypes: {},
  args: { showUrl: false },
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return Wrapper(args);
};

function Wrapper({ initialUrlQuery, showUrl, header, ...props }: StoryProps) {
  const [urlQuery, setUrlQuery] = useState<EntityEditorUrlQuery>(initialUrlQuery ?? {});

  const entitySelectors = useMemo(() => {
    const result: LegacyEntityEditorSelector[] = [];
    if (urlQuery.type) {
      result.push({ newType: urlQuery.type });
    }
    for (const id of urlQuery.ids?.split(',') ?? []) {
      result.push({ id });
    }
    return result;
  }, [urlQuery]);

  const handleEntityIdsChanged = useCallback(
    (ids: string[]) => {
      const idsString = ids.join(',');
      if (idsString !== urlQuery.ids) setUrlQuery({ ids: idsString });
    },
    [urlQuery]
  );

  const displayUrl = useMemo(() => decodeURI(buildUrlWithUrlQuery('/', urlQuery)), [urlQuery]);
  return (
    <LoadContextProvider>
      <LegacyEntityEditorScreen
        {...props}
        header={
          <>
            {showUrl ? <Text textStyle="body2">{displayUrl}</Text> : null}
            {header}
          </>
        }
        entitySelectors={entitySelectors}
        onEntityIdsChanged={handleEntityIdsChanged}
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

export const OpenWithNewType = Template.bind({});
OpenWithNewType.args = {
  initialUrlQuery: { type: 'Bar' },
};
