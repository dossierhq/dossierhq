import { published } from '@jonasb/datadata-admin-react-components';
import type { Entity } from '@jonasb/datadata-core';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { urls } from '../../utils/PageUtils';
import { NavBar } from '../NavBar/NavBar';

const { EntityListScreen } = published;

export default function PublishedEntitiesListPage(): JSX.Element | null {
  const router = useRouter();
  const handleEntityOpen = useCallback(
    (entity: Entity) => router.push(urls.editPage([entity.id])),
    [router]
  );
  const handleUrlQueryChanged = useCallback(
    (urlQuery) => {
      router.replace({ pathname: router.pathname, query: urlQuery });
    },
    [router]
  );

  return (
    <DataDataSharedProvider>
      <Head>
        <title>Entities</title>
      </Head>
      <EntityListScreen
        header={<NavBar current="published-entities" />}
        urlQuery={router.query}
        onUrlQueryChanged={handleUrlQueryChanged}
        onOpenEntity={handleEntityOpen}
      />
    </DataDataSharedProvider>
  );
}
