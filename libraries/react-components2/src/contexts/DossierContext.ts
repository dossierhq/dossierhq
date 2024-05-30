import type {
  Component,
  DossierClient,
  Entity,
  ErrorResult,
  ErrorType,
  Logger,
  Schema,
} from '@dossierhq/core';
import { createContext } from 'react';

export interface DossierContextValue {
  client: DossierClient<Entity<string, object>, Component<string, object>>;
  logger: Logger;
  schema: Schema | undefined;
  schemaError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
}

export const DossierContext = createContext<DossierContextValue>({
  placeholderContextValue: true,
} as unknown as DossierContextValue);
DossierContext.displayName = 'DossierContext';
