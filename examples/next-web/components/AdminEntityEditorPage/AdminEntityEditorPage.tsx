import { AdminEntityEditorScreen } from '@jonasb/datadata-admin-react-components';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { NavBar } from '../NavBar/NavBar';

export default function AdminEntityEditorPage(): JSX.Element {
  const router = useRouter();

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

  return (
    <DataDataSharedProvider>
      <Head>
        <title>Edit entities</title>
      </Head>
      <AdminEntityEditorScreen
        header={<NavBar current="entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={handleUrlSearchParamsChange}
      />
    </DataDataSharedProvider>
  );
}
