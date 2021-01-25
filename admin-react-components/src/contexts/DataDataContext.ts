import type {
  AdminEntity,
  Connection,
  Edge,
  ErrorType,
  PromiseResult,
  Schema,
} from '@datadata/core';
import { createContext } from 'react';

export interface DataDataContextValue {
  schema: Schema;

  searchEntities: () => PromiseResult<
    Connection<Edge<AdminEntity, ErrorType>> | null,
    ErrorType.BadRequest
  >;
}

export const DataDataContext = createContext<DataDataContextValue | null>(null);
DataDataContext.displayName = 'DataDataContext';
