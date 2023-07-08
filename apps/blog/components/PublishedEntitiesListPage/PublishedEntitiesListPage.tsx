import { PublishedEntityListScreen } from '@dossierhq/react-components';
import type { PublishedEntity } from '@dossierhq/core';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { AppPublishedDossierProvider } from '../../contexts/AppPublishedDossierProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { BrowserUrls } from '../../utils/BrowserUrls';
import { NavBar } from '../NavBar/NavBar';

export default function PublishedEntitiesListPage(): JSX.Element | null {
  const router = useRouter();
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  const handleEntityOpen = useCallback(
    (entity: PublishedEntity) => router.push(BrowserUrls.publishedEntityDisplay([entity.id])),
    [router],
  );

  return (
    <AppPublishedDossierProvider>
      <Head>
        <title>Published entities | Blog</title>
      </Head>
      <PublishedEntityListScreen
        header={<NavBar current="published-entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
        onOpenEntity={handleEntityOpen}
      />
    </AppPublishedDossierProvider>
  );
}
