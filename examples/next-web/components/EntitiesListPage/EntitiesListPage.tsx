import { AdminEntityListScreen } from '@jonasb/datadata-admin-react-components';
import type { AdminEntity } from '@dossierhq/core';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { urls } from '../../utils/PageUtils';
import { NavBar } from '../NavBar/NavBar';

export default function EntitiesListPage(): JSX.Element | null {
  const router = useRouter();
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  const handleCreateEntity = useCallback(
    (type: string) => router.push(urls.editPageNew(type, crypto.randomUUID())),
    [router]
  );
  const handleEntityOpen = useCallback(
    (entity: AdminEntity) => router.push(urls.editPage([entity.id])),
    [router]
  );

  return (
    <DataDataSharedProvider>
      <Head>
        <title>Entities</title>
      </Head>
      <AdminEntityListScreen
        header={<NavBar current="entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
        onCreateEntity={handleCreateEntity}
        onOpenEntity={handleEntityOpen}
      />
    </DataDataSharedProvider>
  );
}
