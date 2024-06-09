'use client';

import { ContentEditorScreen } from '@dossierhq/react-components2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';

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
      router.replace(`/dossier2/content/edit?${urlSearchParams.toString()}`);
    },
    [router],
  );

  return (
    <ContentEditorScreen
      urlSearchParams={urlSearchParams}
      onUrlSearchParamsChange={handleUrlSearchParamsChange}
      onEditorHasChangesChange={setHasChanges}
    />
  );
}
