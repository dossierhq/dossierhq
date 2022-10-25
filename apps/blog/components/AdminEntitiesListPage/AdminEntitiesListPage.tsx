import type { EntitySearchStateUrlQuery } from '@jonasb/datadata-admin-react-components';
import { AdminEntityListScreen } from '@jonasb/datadata-admin-react-components';
import type { AdminEntity } from '@jonasb/datadata-core';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { urls } from '../../utils/PageUtils';
import { NavBar } from '../NavBar/NavBar';

export default function AdminEntitiesListPage(): JSX.Element | null {
  const router = useRouter();
  const handleCreateEntity = useCallback(
    (type: string) => router.push(urls.editPageNew(type, crypto.randomUUID())),
    [router]
  );
  const handleEntityOpen = useCallback(
    (entity: AdminEntity) => router.push(urls.editPage([entity.id])),
    [router]
  );
  const handleUrlQueryChanged = useCallback(
    (urlQuery: EntitySearchStateUrlQuery) => {
      // @ts-ignore TODO fix type of url query
      router.replace({ pathname: router.pathname, query: urlQuery });
    },
    [router]
  );

  return (
    <DataDataSharedProvider>
      <Head>
        <title>Entities</title>
      </Head>
      <AdminEntityListScreen
        header={<NavBar current="admin-entities" />}
        urlQuery={router.query}
        onUrlQueryChanged={handleUrlQueryChanged}
        onCreateEntity={handleCreateEntity}
        onOpenEntity={handleEntityOpen}
      />
    </DataDataSharedProvider>
  );
}
