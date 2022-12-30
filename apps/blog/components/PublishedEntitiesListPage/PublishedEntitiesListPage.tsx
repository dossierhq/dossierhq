import { PublishedEntityListScreen } from '@jonasb/datadata-admin-react-components';
import type { PublishedEntity } from '@jonasb/datadata-core';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { AppPublishedDataDataProvider } from '../../contexts/AppPublishedDataDataProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { BrowserUrls } from '../../utils/BrowserUrls';
import { NavBar } from '../NavBar/NavBar';

export default function PublishedEntitiesListPage(): JSX.Element | null {
  const router = useRouter();
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  const handleEntityOpen = useCallback(
    (entity: PublishedEntity) => router.push(BrowserUrls.publishedEntityDisplay([entity.id])),
    [router]
  );

  return (
    <AppPublishedDataDataProvider>
      <Head>
        <title>Published entities</title>
      </Head>
      <PublishedEntityListScreen
        header={<NavBar current="published-entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
        onOpenEntity={handleEntityOpen}
      />
    </AppPublishedDataDataProvider>
  );
}
