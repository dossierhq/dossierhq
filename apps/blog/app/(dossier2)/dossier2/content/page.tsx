'use client';

import { ContentListScreen } from '@dossierhq/react-components2';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function Page() {
  const router = useRouter();
  const handleOpenEntity = useCallback(
    (id: string) => {
      router.push(`/dossier2/content/edit?id=${id}`);
    },
    [router],
  );
  return <ContentListScreen onOpenEntity={handleOpenEntity} />;
}
