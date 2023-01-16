import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import { SWRConfig } from 'swr';

interface Props {
  ownCache: boolean;
  children: ReactNode;
}

export function CacheConfig({ ownCache, children }: Props) {
  const config = useMemo(() => {
    const cache = new Map();
    return ownCache ? { provider: () => cache } : {};
  }, [ownCache]);
  return <SWRConfig value={config}>{children}</SWRConfig>;
}
