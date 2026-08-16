'use client';

import { PublishedContentDisplayScreen } from '@dossierhq/react-components2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback } from 'react';
import { AppPublishedDossierProvider } from '../../../../../contexts/AppPublishedDossierProvider';
import { BrowserUrls } from '../../../../../utils/BrowserUrls';
import { DossierNavBar } from '../../DossierNavBar';

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

  const handleUrlSearchParamsChange = useCallback(
    (urlSearchParams: URLSearchParams) => {
      router.replace(`${BrowserUrls.publishedContentDisplay}?${urlSearchParams.toString()}`);
    },
    [router],
  );

  return (
    <AppPublishedDossierProvider>
      <PublishedContentDisplayScreen
        header={<DossierNavBar current="published-content" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={handleUrlSearchParamsChange}
      />
    </AppPublishedDossierProvider>
  );
}
