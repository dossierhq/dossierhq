import type { DataDataContextAdapter } from '@datadata/admin-react-components';
import { DataDataContextValue } from '@datadata/admin-react-components';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntityVersion,
  ErrorType,
  ok,
  Schema,
} from '@datadata/core';
import { useEffect, useMemo, useState } from 'react';
import type { EntityCreateRequest, EntityUpdateRequest } from '../types/RequestTypes';
import type {
  ActionResponse,
  EntityHistoryResponse,
  EntityResponse,
  SchemaResponse,
  SearchEntitiesResponse,
} from '../types/ResponseTypes';
import { fetchJson, fetchJsonResult, urls } from '../utils/BackendUtils';

class ContextAdapter implements DataDataContextAdapter {
  getEntity: DataDataContextAdapter['getEntity'] = async (id, version) => {
    const result = await fetchJsonResult<EntityResponse, ErrorType.NotFound>(
      [ErrorType.NotFound],
      urls.getEntity(id, version)
    );
    if (result.isOk()) {
      return ok(result.value.item);
    }
    return result;
  };

  getEntityHistory: DataDataContextAdapter['getEntityHistory'] = async (id) => {
    const result = await fetchJsonResult<EntityHistoryResponse, ErrorType.NotFound>(
      [ErrorType.NotFound],
      urls.getEntityHistory(id)
    );
    if (result.isOk()) {
      return ok(convertJsonEntityVersion(result.value));
    }
    return result;
  };

  searchEntities: DataDataContextAdapter['searchEntities'] = async (query, paging) => {
    const result = await fetchJsonResult<SearchEntitiesResponse, ErrorType.BadRequest>(
      [ErrorType.BadRequest],
      urls.searchEntities(query, paging)
    );
    if (result.isOk()) {
      return ok(convertJsonConnection(result.value, convertJsonEdge));
    }
    return result;
  };

  createEntity: DataDataContextAdapter['createEntity'] = async (entity) => {
    const body: EntityCreateRequest = { item: entity };
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
      return ok(result.value.item);
    }
    return result;
  };

  updateEntity: DataDataContextAdapter['updateEntity'] = async (entity) => {
    const body: EntityUpdateRequest = { item: entity };
    const result = await fetchJsonResult<EntityResponse, ErrorType.BadRequest | ErrorType.NotFound>(
      [ErrorType.BadRequest, ErrorType.NotFound],
      urls.getEntity(entity.id), //TODO
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (result.isOk()) {
      return ok(result.value.item);
    }
    return result;
  };

  publishEntity: DataDataContextAdapter['publishEntity'] = async (id, version) => {
    const result = await fetchJsonResult<ActionResponse, ErrorType.BadRequest | ErrorType.NotFound>(
      [ErrorType.BadRequest, ErrorType.NotFound],
      urls.publishEntity(id, version),
      {
        method: 'PUT',
      }
    );

    if (result.isOk()) {
      return ok(undefined);
    }
    return result;
  };
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

  const contextValue = useMemo(
    () => (schema ? new DataDataContextValue(new ContextAdapter(), schema) : null),
    [schema]
  );

  return { contextValue };
}
