'use client';

import { ContentEditorScreen } from '@dossierhq/react-components2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';
import { AppAdminDossierProvider } from '../../../../../contexts/AppAdminDossierProvider';
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
  const [_hasChanges, setHasChanges] = useState(false);

  const handleUrlSearchParamsChange = useCallback(
    (urlSearchParams: URLSearchParams) => {
      router.replace(`${BrowserUrls.contentEditor}?${urlSearchParams.toString()}`);
    },
    [router],
  );

  return (
    <AppAdminDossierProvider>
      <ContentEditorScreen
        header={<DossierNavBar current="content" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={handleUrlSearchParamsChange}
        onEditorHasChangesChange={setHasChanges}
      />
    </AppAdminDossierProvider>
  );
}
