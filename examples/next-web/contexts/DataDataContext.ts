import type { DataDataContextValue } from '@datadata/admin-react-components';
import type {
  AdminEntity,
  Connection,
  Edge,
  ErrorResult,
  PromiseResult,
  Result,
} from '@datadata/core';
import { createErrorResult, ErrorType, ok, Schema } from '@datadata/core';
import { useEffect, useMemo, useState } from 'react';
import type {
  JsonConnection,
  JsonEdge,
  JsonResult,
  SchemaResponse,
  SearchEntitiesResponse,
} from '../types/ResponseTypes';
import { fetchJsonAsync, fetchJsonResult, urls } from '../utils/BackendUtils';

class ContextValue implements DataDataContextValue {
  schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  async searchEntities(): PromiseResult<
    Connection<Edge<AdminEntity, ErrorType>> | null,
    ErrorType.BadRequest
  > {
    const result = await fetchJsonResult<SearchEntitiesResponse, ErrorType.BadRequest>(
      [ErrorType.BadRequest],
      urls.searchEntities
    );
    if (result.isOk() && result.value?.edges) {
      const connection = convertJsonConnection(result.value, convertJsonEdge);
      return ok(connection);
    }
    return result as ErrorResult<unknown, ErrorType.BadRequest>;
  }
}

function convertJsonEdge<TOk, TError extends ErrorType>(
  jsonEdge: JsonEdge<TOk, TError>
): Edge<TOk, TError> {
  return { node: convertJsonResult(jsonEdge.node), cursor: jsonEdge.cursor };
}

function convertJsonResult<TOk, TError extends ErrorType>(
  jsonResult: JsonResult<TOk, TError>
): Result<TOk, TError> {
  if ('value' in jsonResult) {
    return ok(jsonResult.value);
  }
  return createErrorResult(jsonResult.error, jsonResult.message);
}

function convertJsonConnection<
  TIn extends JsonEdge<unknown, ErrorType>,
  TOut extends Edge<unknown, ErrorType>
>(jsonConnection: JsonConnection<TIn>, edgeConverter: (edge: TIn) => TOut): Connection<TOut> {
  return { pageInfo: jsonConnection.pageInfo, edges: jsonConnection.edges.map(edgeConverter) };
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
