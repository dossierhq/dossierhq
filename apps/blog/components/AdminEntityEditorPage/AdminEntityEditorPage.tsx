import { EntityEditorScreen } from '@jonasb/datadata-admin-react-components';
import Head from 'next/head';
import { useMemo, useState } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { useWarningOnExit } from '../../hooks/useWarningOnExit';
import { urls } from '../../utils/PageUtils';
import { NavBar } from '../NavBar/NavBar';

export default function AdminEntityEditorPage(): JSX.Element {
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();
  const [hasChanges, setHasChanges] = useState(false);

  const shouldWarn = useMemo(() => {
    if (!hasChanges) return false;
    return (_fromUrl: string, toUrl: string) => {
      return !urls.isEditPage(toUrl);
    };
  }, [hasChanges]);

  useWarningOnExit('Changes will be lost, are you sure you want to leave the page?', shouldWarn);

  return (
    <DataDataSharedProvider>
      <Head>
        <title>Edit entities</title>
      </Head>
      <EntityEditorScreen
        header={<NavBar current="admin-entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
        onEditorHasChangesChange={setHasChanges}
      />
    </DataDataSharedProvider>
  );
}
