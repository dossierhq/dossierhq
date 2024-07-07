'use client';

import {
  addContentEditorParamsToURLSearchParams,
  ContentListScreen,
} from '@dossierhq/react-components2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback } from 'react';

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
      router.push(`/dossier2/content/edit?${editorUrlsSearchParams.toString()}`);
    },
    [router, urlSearchParams],
  );

  const handleCreateEntity = useCallback(
    (type: string) => {
      const editorUrlsSearchParams = new URLSearchParams(urlSearchParams ?? undefined);
      addContentEditorParamsToURLSearchParams(editorUrlsSearchParams, {
        entities: [{ type, isNew: true, id: crypto.randomUUID() }],
      });
      router.push(`/dossier2/content/edit?${editorUrlsSearchParams.toString()}`);
    },
    [router, urlSearchParams],
  );

  const handleUrlSearchParamsChange = useCallback(
    (urlSearchParams: URLSearchParams) => {
      router.replace(`/dossier2/content?${urlSearchParams.toString()}`);
    },
    [router],
  );

  return (
    <ContentListScreen
      urlSearchParams={urlSearchParams}
      onOpenEntity={handleOpenEntity}
      onCreateEntity={handleCreateEntity}
      onUrlSearchParamsChange={handleUrlSearchParamsChange}
    />
  );
}
