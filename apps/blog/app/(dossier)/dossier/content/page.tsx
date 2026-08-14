'use client';

import {
  addContentEditorParamsToURLSearchParams,
  ContentListScreen,
} from '@dossierhq/react-components2';
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

  const handleOpenEntity = useCallback(
    (id: string) => {
      const editorUrlsSearchParams = new URLSearchParams(urlSearchParams ?? undefined);
      addContentEditorParamsToURLSearchParams(editorUrlsSearchParams, { entities: [{ id }] });
      router.push(`${BrowserUrls.contentEditor}?${editorUrlsSearchParams.toString()}`);
    },
    [router, urlSearchParams],
  );

  const handleCreateEntity = useCallback(
    (type: string) => {
      const editorUrlsSearchParams = new URLSearchParams(urlSearchParams ?? undefined);
      addContentEditorParamsToURLSearchParams(editorUrlsSearchParams, {
        entities: [{ type, isNew: true, id: crypto.randomUUID() }],
      });
      router.push(`${BrowserUrls.contentEditor}?${editorUrlsSearchParams.toString()}`);
    },
    [router, urlSearchParams],
  );

  const handleUrlSearchParamsChange = useCallback(
    (urlSearchParams: URLSearchParams) => {
      router.replace(`${BrowserUrls.content}?${urlSearchParams.toString()}`);
    },
    [router],
  );

  return (
    <AppAdminDossierProvider>
      <ContentListScreen
        header={<DossierNavBar current="content" />}
        urlSearchParams={urlSearchParams}
        onOpenEntity={handleOpenEntity}
        onCreateEntity={handleCreateEntity}
        onUrlSearchParamsChange={handleUrlSearchParamsChange}
      />
    </AppAdminDossierProvider>
  );
}
