import { PublishedEntityDisplayScreen } from '@jonasb/datadata-admin-react-components';
import Head from 'next/head';
import { useRouter } from 'next/router.js';
import { useCallback, useMemo } from 'react';
import { PublishedDataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { NavBar } from '../NavBar/NavBar';

export default function PublishedEntityDetailPage(): JSX.Element | null {
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
    <PublishedDataDataSharedProvider>
      <Head>
        <title>Published entities</title>
      </Head>
      <PublishedEntityDisplayScreen
        header={<NavBar current="published-entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={handleUrlSearchParamsChange}
      />
    </PublishedDataDataSharedProvider>
  );
}
