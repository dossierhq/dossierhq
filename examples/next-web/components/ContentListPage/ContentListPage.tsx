import type { Entity } from '@dossierhq/core';
import { ContentListScreen } from '@dossierhq/react-components';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { AppAdminDossierProvider } from '../../contexts/AppAdminDossierProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { BrowserUrls } from '../../utils/BrowserUrls';
import { NavBar } from '../NavBar/NavBar';

export default function ContentListPage(): JSX.Element | null {
  const router = useRouter();
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  const handleCreateEntity = useCallback(
    (type: string) => router.push(BrowserUrls.contentEditorNew(type, crypto.randomUUID())),
    [router],
  );
  const handleEntityOpen = useCallback(
    (entity: Entity) => router.push(BrowserUrls.contentEditor([entity.id])),
    [router],
  );

  return (
    <AppAdminDossierProvider>
      <Head>
        <title>Content | {process.env.NEXT_PUBLIC_SITE_NAME}</title>
      </Head>
      <ContentListScreen
        header={<NavBar current="content" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
        onCreateEntity={handleCreateEntity}
        onOpenEntity={handleEntityOpen}
      />
    </AppAdminDossierProvider>
  );
}
