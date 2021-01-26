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

  getEntity: (
    id: string,
    options: { version?: number | null }
  ) => PromiseResult<{ item: AdminEntity }, ErrorType.NotFound>;
  searchEntities: (
    query?: AdminQuery,
    paging?: Paging
  ) => PromiseResult<Connection<Edge<AdminEntity, ErrorType>> | null, ErrorType.BadRequest>;
}

export const DataDataContext = createContext<DataDataContextValue | null>(null);
DataDataContext.displayName = 'DataDataContext';
