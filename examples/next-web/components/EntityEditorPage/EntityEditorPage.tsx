import { EntityEditorScreen } from '@jonasb/datadata-admin-react-components';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { useWarningOnExit } from '../../hooks/useWarningOnExit';
import { NavBar } from '../NavBar/NavBar';

export default function EntityEditorPage(): JSX.Element {
  const router = useRouter();
  const [hasChanges, setHasChanges] = useState(false);

  const urlSearchParams = useMemo(() => {
    const result = new URLSearchParams();
    for (const [key, value] of Object.entries(router.query)) {
      if (Array.isArray(value)) {
        value.forEach((valueItem) => result.append(key, valueItem));
      } else if (typeof value === 'string') {
        result.append(key, value);
      }
    }
    return result;
  }, [router.query]);

  const handleUrlSearchParamsChange = useCallback(
    (urlSearchParams: URLSearchParams) => {
      router.replace({ pathname: router.pathname, query: urlSearchParams.toString() });
    },
    [router]
  );

  useWarningOnExit('Changes will be lost, are you sure you want to leave the page?', hasChanges);

  return (
    <DataDataSharedProvider>
      <Head>
        <title>Edit entities</title>
      </Head>
      <EntityEditorScreen
        header={<NavBar current="entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={handleUrlSearchParamsChange}
        onEditorHasChangesChange={setHasChanges}
      />
    </DataDataSharedProvider>
  );
}
