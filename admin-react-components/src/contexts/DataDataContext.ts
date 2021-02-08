import type {
  AdminEntity,
  AdminQuery,
  Connection,
  Edge,
  ErrorType,
  Paging,
  PromiseResult,
  Schema,
} from '@datadata/core';
import { createContext } from 'react';

export interface DataDataContextValue {
  schema: Schema;

  /** Loads an entity. If `id` is `undefined` no data is fetched */
  useEntity: (
    id: string | undefined,
    options: { version?: number | null }
  ) => { entity?: { item: AdminEntity }; entityError?: Error };

  getEntity: (
    id: string,
    options: { version?: number | null }
  ) => PromiseResult<{ item: AdminEntity }, ErrorType.NotFound>;

  useSearchEntities: (
    query?: AdminQuery,
    paging?: Paging
  ) => { connection?: Connection<Edge<AdminEntity, ErrorType>> | null; connectionError?: Error };
}

export const DataDataContext = createContext<DataDataContextValue | null>(null);
DataDataContext.displayName = 'DataDataContext';
