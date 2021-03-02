import type { DataDataContextValue } from '@datadata/admin-react-components';
import type { ErrorResultError } from '@datadata/core';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntityVersion,
  createErrorResultFromError,
  ErrorType,
  ok,
  Schema,
} from '@datadata/core';
import { useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import type { EntityCreateRequest, EntityUpdateRequest } from '../types/RequestTypes';
import type {
  EntityHistoryResponse,
  EntityResponse,
  SchemaResponse,
  SearchEntitiesResponse,
} from '../types/ResponseTypes';
import { fetchJson, fetchJsonResult, swrFetcher, urls } from '../utils/BackendUtils';

class ContextValue implements DataDataContextValue {
  schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  useEntity: DataDataContextValue['useEntity'] = (id, options) => {
    const { data, error } = useSWR<EntityResponse, ErrorResultError>(
      id ? urls.getEntity(id, options) : null,
      swrFetcher
    );
    const entityError = error ? createErrorResultFromError(error) : undefined;
    return { entity: data, entityError };
  };

  useEntityHistory: DataDataContextValue['useEntityHistory'] = (id) => {
    const { data, error } = useSWR<EntityHistoryResponse, ErrorResultError>(
      id ? urls.getEntityHistory(id) : null,
      swrFetcher
    );

    const entityHistoryError = error ? createErrorResultFromError(error) : undefined;
    if (data) {
      return { entityHistory: convertJsonEntityVersion(data), entityHistoryError };
    }
    return { entityHistory: undefined, entityHistoryError };
  };

  useSearchEntities: DataDataContextValue['useSearchEntities'] = (query, paging) => {
    const { data, error } = useSWR<SearchEntitiesResponse, ErrorResultError>(
      query ? urls.searchEntities(query, paging) : null
    );
    const connectionError = error ? createErrorResultFromError(error) : undefined;
    if (data) {
      const connection = convertJsonConnection(data, convertJsonEdge);
      return { connection, connectionError };
    }
    return { connection: undefined, connectionError };
  };

  createEntity: DataDataContextValue['createEntity'] = async (entity, options) => {
    const body: EntityCreateRequest = { item: entity, options };
    const result = await fetchJsonResult<EntityResponse, ErrorType.BadRequest>(
      [ErrorType.BadRequest],
      urls.createEntity,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (result.isOk()) {
      updateCachedEntity(result.value);
      return ok(result.value.item);
    }
    return result;
  };

  updateEntity: DataDataContextValue['updateEntity'] = async (entity, options) => {
    const body: EntityUpdateRequest = { item: entity, options };
    const result = await fetchJsonResult<EntityResponse, ErrorType.BadRequest | ErrorType.NotFound>(
      [ErrorType.BadRequest, ErrorType.NotFound],
      urls.getEntity(entity.id, {}), //TODO
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (result.isOk()) {
      updateCachedEntity(result.value);
      return ok(result.value.item);
    }
    return result;
  };
}

function updateCachedEntity(entity: EntityResponse) {
  mutate(urls.getEntity(entity.item.id, {}), entity, false);
}

async function loadSchema() {
  //TODO swr?

  const schemaResponse = await fetchJson<SchemaResponse>(urls.schema);
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
