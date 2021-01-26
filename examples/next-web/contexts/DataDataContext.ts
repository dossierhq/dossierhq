import type { DataDataContextValue } from '@datadata/admin-react-components';
import type {
  AdminEntity,
  AdminQuery,
  Connection,
  Edge,
  ErrorResult,
  Paging,
  PromiseResult,
} from '@datadata/core';
import { convertJsonConnection, convertJsonEdge, ErrorType, ok, Schema } from '@datadata/core';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import type {
  EntityResponse,
  SchemaResponse,
  SearchEntitiesResponse,
} from '../types/ResponseTypes';
import { fetchJsonAsync, fetchJsonResult, urls } from '../utils/BackendUtils';

class ContextValue implements DataDataContextValue {
  schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  useEntity(
    id: string | undefined,
    options: { version?: number | null }
  ): { entity?: { item: AdminEntity }; entityError?: Error } {
    const { data, error } = useSWR<EntityResponse>(id ? urls.getEntity(id, options) : null);
    return { entity: data, entityError: error };
  }

  async getEntity(
    id: string,
    options: { version?: number | null }
  ): PromiseResult<{ item: AdminEntity }, ErrorType.NotFound> {
    return await fetchJsonResult<EntityResponse, ErrorType.NotFound>(
      [ErrorType.NotFound],
      urls.getEntity(id, options)
    );
  }

  async searchEntities(
    query?: AdminQuery,
    paging?: Paging
  ): PromiseResult<Connection<Edge<AdminEntity, ErrorType>> | null, ErrorType.BadRequest> {
    const result = await fetchJsonResult<SearchEntitiesResponse, ErrorType.BadRequest>(
      [ErrorType.BadRequest],
      urls.searchEntities(query, paging)
    );
    if (result.isOk() && result.value?.edges) {
      const connection = convertJsonConnection(result.value, convertJsonEdge);
      return ok(connection);
    }
    return result as ErrorResult<unknown, ErrorType.BadRequest>;
  }
}

async function loadSchema() {
  //TODO swr?

  const schemaResponse = await fetchJsonAsync<SchemaResponse>(urls.schema);
  const schema = new Schema(schemaResponse.spec);
  return schema;
}

export function useInitializeContext(): { contextValue: DataDataContextValue | null } {
  const [schema, setSchema] = useState<Schema | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await loadSchema();
        setSchema(s);
      } catch (error) {
        //TODO handle error, support retry
        console.warn(error);
      }
    })();
  }, []);

  const contextValue = useMemo(() => (schema ? new ContextValue(schema) : null), [schema]);

  return { contextValue };
}
