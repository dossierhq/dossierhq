'use client';

import { ContentEditorScreen } from '@dossierhq/react-components2';
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

  const handleUrlSearchParamsChange = useCallback(
    (urlSearchParams: URLSearchParams) => {
      router.replace(`/dossier2/content/edit?${urlSearchParams.toString()}`);
    },
    [router],
  );

  return (
    <ContentEditorScreen
      urlSearchParams={urlSearchParams}
      onUrlSearchParamsChange={handleUrlSearchParamsChange}
    />
  );
}
