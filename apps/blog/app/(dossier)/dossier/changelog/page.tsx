'use client';

import { ChangelogListScreen } from '@dossierhq/react-components2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback } from 'react';
import { AppAdminDossierProvider } from '../../../../contexts/AppAdminDossierProvider';
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

  const handleUrlSearchParamsChange = useCallback(
    (urlSearchParams: URLSearchParams) => {
      router.replace(`${BrowserUrls.changelog}?${urlSearchParams.toString()}`);
    },
    [router],
  );

  return (
    <AppAdminDossierProvider>
      <ChangelogListScreen
        header={<DossierNavBar current="changelog" />}
        urlSearchParams={urlSearchParams ?? undefined}
        onUrlSearchParamsChange={handleUrlSearchParamsChange}
      />
    </AppAdminDossierProvider>
  );
}
