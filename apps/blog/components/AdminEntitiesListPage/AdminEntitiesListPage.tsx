import { AdminEntityListScreen } from '@jonasb/datadata-admin-react-components';
import type { AdminEntity } from '@jonasb/datadata-core';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { AppAdminDataDataProvider } from '../../contexts/AppAdminDataDataProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { BrowserUrls } from '../../utils/BrowserUrls';
import { NavBar } from '../NavBar/NavBar';

export default function AdminEntitiesListPage(): JSX.Element | null {
  const router = useRouter();
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  const handleCreateEntity = useCallback(
    (type: string) => router.push(BrowserUrls.editPageNew(type, crypto.randomUUID())),
    [router]
  );
  const handleEntityOpen = useCallback(
    (entity: AdminEntity) => router.push(BrowserUrls.editPage([entity.id])),
    [router]
  );

  return (
    <AppAdminDataDataProvider>
      <Head>
        <title>Admin entities</title>
      </Head>
      <AdminEntityListScreen
        header={<NavBar current="admin-entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
        onCreateEntity={handleCreateEntity}
        onOpenEntity={handleEntityOpen}
      />
    </AppAdminDataDataProvider>
  );
}
