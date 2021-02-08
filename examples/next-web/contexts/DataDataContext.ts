import type { DataDataContextValue } from '@datadata/admin-react-components';
import { convertJsonConnection, convertJsonEdge, ErrorType, Schema } from '@datadata/core';
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

  useEntity: DataDataContextValue['useEntity'] = (id, options) => {
    const { data, error } = useSWR<EntityResponse>(id ? urls.getEntity(id, options) : null);
    return { entity: data, entityError: error };
  };

  getEntity: DataDataContextValue['getEntity'] = async (id, options) => {
    return await fetchJsonResult<EntityResponse, ErrorType.NotFound>(
      [ErrorType.NotFound],
      urls.getEntity(id, options)
    );
  };

  useSearchEntities: DataDataContextValue['useSearchEntities'] = (query, paging) => {
    const { data, error } = useSWR<SearchEntitiesResponse>(urls.searchEntities(query, paging));
    if (data) {
      const connection = convertJsonConnection(data, convertJsonEdge);
      return { connection, connectionError: error };
    }
    return { connection: undefined, connectionError: error };
  };
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
