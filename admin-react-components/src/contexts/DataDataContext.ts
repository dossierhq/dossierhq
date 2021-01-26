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

  searchEntities: (
    query?: AdminQuery,
    paging?: Paging
  ) => PromiseResult<Connection<Edge<AdminEntity, ErrorType>> | null, ErrorType.BadRequest>;
}

export const DataDataContext = createContext<DataDataContextValue | null>(null);
DataDataContext.displayName = 'DataDataContext';
