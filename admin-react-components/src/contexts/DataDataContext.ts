import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminQuery,
  Connection,
  Edge,
  ErrorResult,
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
  ) => { entity?: { item: AdminEntity }; entityError?: ErrorResult<unknown, ErrorType> };

  /** Searches for entities. If `query` is `undefined` no data is fetched */
  useSearchEntities: (
    query?: AdminQuery,
    paging?: Paging
  ) => {
    connection?: Connection<Edge<AdminEntity, ErrorType>> | null;
    connectionError?: ErrorResult<unknown, ErrorType>;
  };

  createEntity: (
    entity: AdminEntityCreate,
    options: { publish: boolean }
  ) => PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.Generic>;

  updateEntity: (
    entity: AdminEntityUpdate,
    options: { publish: boolean }
  ) => PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic>;
}

export const DataDataContext = createContext<DataDataContextValue | null>(null);
DataDataContext.displayName = 'DataDataContext';
