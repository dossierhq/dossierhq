import { PublishedEntityListScreen } from '@dossierhq/react-components';
import type { PublishedEntity } from '@dossierhq/core';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { PublishedDossierSharedProvider } from '../../contexts/DossierSharedProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { urls } from '../../utils/PageUtils';
import { NavBar } from '../NavBar/NavBar';

export default function PublishedEntitiesListPage(): JSX.Element | null {
  const router = useRouter();
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  const handleEntityOpen = useCallback(
    (entity: PublishedEntity) => router.push(urls.publishedEntityDisplay([entity.id])),
    [router]
  );

  return (
    <PublishedDossierSharedProvider>
      <Head>
        <title>Published entities</title>
      </Head>
      <PublishedEntityListScreen
        header={<NavBar current="published-entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
        onOpenEntity={handleEntityOpen}
      />
    </PublishedDossierSharedProvider>
  );
}
