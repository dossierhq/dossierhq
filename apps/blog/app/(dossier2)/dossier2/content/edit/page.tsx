'use client';

import { ContentEditorScreen } from '@dossierhq/react-components2';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const searchParams = useSearchParams();
  return <ContentEditorScreen urlSearchParams={searchParams} />;
}
