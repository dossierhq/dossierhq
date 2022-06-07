import { EntityEditorScreen } from '@jonasb/datadata-admin-react-components';
import Head from 'next/head';
import { useState } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { useWarningOnExit } from '../../hooks/useWarningOnExit';
import { NavBar } from '../NavBar/NavBar';

export default function EntityEditorPage(): JSX.Element {
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();
  const [hasChanges, setHasChanges] = useState(false);

  useWarningOnExit('Changes will be lost, are you sure you want to leave the page?', hasChanges);

  return (
    <DataDataSharedProvider>
      <Head>
        <title>Edit entities</title>
      </Head>
      <EntityEditorScreen
        header={<NavBar current="entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
        onEditorHasChangesChange={setHasChanges}
      />
    </DataDataSharedProvider>
  );
}
