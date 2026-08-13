'use client';

import {
  addContentDisplayParamsToURLSearchParams,
  PublishedContentListScreen,
} from '@dossierhq/react-components2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback } from 'react';
import { AppPublishedDossierProvider } from '../../../../contexts/AppPublishedDossierProvider';
import { BrowserUrls } from '../../../../utils/BrowserUrls';
import { DossierNavBar } from '../DossierNavBar';

export default function Page() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  const handleOpenEntity = useCallback(
    (id: string) => {
      const displayUrlSearchParams = new URLSearchParams(urlSearchParams ?? undefined);
      addContentDisplayParamsToURLSearchParams(displayUrlSearchParams, { entityIds: [id] });
      router.push(`${BrowserUrls.publishedContentDisplay}?${displayUrlSearchParams.toString()}`);
    },
    [router, urlSearchParams],
  );

  const handleUrlSearchParamsChange = useCallback(
    (urlSearchParams: URLSearchParams) => {
      router.replace(`${BrowserUrls.publishedContent}?${urlSearchParams.toString()}`);
    },
    [router],
  );

  return (
    <AppPublishedDossierProvider>
      <PublishedContentListScreen
        header={<DossierNavBar current="published-content" />}
        urlSearchParams={urlSearchParams}
        onOpenEntity={handleOpenEntity}
        onUrlSearchParamsChange={handleUrlSearchParamsChange}
      />
    </AppPublishedDossierProvider>
  );
}
