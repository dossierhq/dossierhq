import type { ReactNode } from 'react';
import React from 'react';
import { SWRConfig } from 'swr';

interface Props {
  ownCache: boolean;
  children: ReactNode;
}

export function CacheConfig({ ownCache, children }: Props) {
  return <SWRConfig value={ownCache ? { provider: () => new Map() } : {}}>{children}</SWRConfig>;
}
