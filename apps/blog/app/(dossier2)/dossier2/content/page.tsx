'use client';

import { ContentListScreen } from '@dossierhq/react-components2';
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
      router.push(`/dossier2/content/edit?id=${id}`);
    },
    [router],
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
      onUrlSearchParamsChange={handleUrlSearchParamsChange}
    />
  );
}
