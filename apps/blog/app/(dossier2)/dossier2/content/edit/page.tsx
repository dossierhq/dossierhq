'use client';

import { ContentEditorScreen } from '@dossierhq/react-components2';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  return <ContentEditorScreen urlSearchParams={searchParams} />;
}
