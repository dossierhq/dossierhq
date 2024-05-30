import type { Component, DossierClient, Entity, Logger } from '@dossierhq/core';
import { createContext } from 'react';

export interface DossierContextValue {
  client: DossierClient<Entity<string, object>, Component<string, object>>;
  logger: Logger;
}

export const DossierContext = createContext<DossierContextValue>({
  placeholderContextValue: true,
} as unknown as DossierContextValue);
DossierContext.displayName = 'DossierContext';
