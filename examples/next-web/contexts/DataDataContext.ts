import type {
  DataDataContextAdapter,
  EditorJsToolSettings,
} from '@jonasb/datadata-admin-react-components';
import { DataDataContextValue } from '@jonasb/datadata-admin-react-components';
import {
  AdminClientOperationName,
  assertExhaustive,
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntityHistory,
  convertJsonPublishingHistory,
  createBaseAdminClient,
  ErrorType,
  ok,
  Schema,
} from '@jonasb/datadata-core';
import type { AdminClient, AdminClientOperation, AdminEntity, Result } from '@jonasb/datadata-core';
import { useEffect, useMemo, useState } from 'react';
import type {
  EntityArchiveRequest,
  EntityCreateRequest,
  EntityPublishRequest,
  EntityUnarchiveRequest,
  EntityUnpublishRequest,
  EntityUpdateRequest,
} from '../types/RequestTypes';
import type {
  EntityHistoryResponse,
  EntityResponse,
  PublishingHistoryResponse,
  PublishingResultListResponse,
  PublishingResultResponse,
  SchemaResponse,
  SearchEntitiesResponse,
  TotalCountResponse,
} from '../types/ResponseTypes';
import { fetchJson, fetchJsonResult, urls } from '../utils/BackendUtils';
import customTools from './EditorJsTools';

type BackendContext = Record<never, never>;

class ContextAdapter implements DataDataContextAdapter {
  getEditorJSConfig: DataDataContextAdapter['getEditorJSConfig'] = (
    fieldSpec,
    standardBlockTools,
    standardInlineTools
  ) => {
    const defaultInlineToolbar = [...standardInlineTools, ...Object.keys(customTools.inlineTools)];

    const tools: { [toolName: string]: EditorJsToolSettings } = {};

    if (fieldSpec.richTextBlocks && fieldSpec.richTextBlocks.length > 0) {
      for (const { type, inlineTypes } of fieldSpec.richTextBlocks) {
        if (standardBlockTools[type]) {
          tools[type] = standardBlockTools[type];
        } else {
          const blockTool = customTools.blockTools[type];
          if (blockTool) {
            tools[type] = { class: blockTool, inlineToolbar: inlineTypes ?? true };
          } else {
            throw new Error(`No support for tool ${type}`);
          }
        }
      }
    } else {
      Object.entries(standardBlockTools).forEach(
        ([toolName, config]) => (tools[toolName] = config)
      );
      Object.entries(customTools.blockTools).forEach(
        ([toolName, constructable]) =>
          (tools[toolName] = {
            class: constructable,
            inlineToolbar: true,
          })
      );
    }

    Object.entries(customTools.inlineTools).forEach(
      ([toolName, constructable]) =>
        (tools[toolName] = {
          class: constructable,
        })
    );

    return { tools, inlineToolbar: defaultInlineToolbar };
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
    () =>
      schema
        ? new DataDataContextValue(new ContextAdapter(), createBackendAdminClient(), schema)
        : null,
    [schema]
  );

  return { contextValue };
}

function createBackendAdminClient(): AdminClient {
  const context: BackendContext = {};
  return createBaseAdminClient({
    resolveContext: () => Promise.resolve(context),
    pipeline: [terminatingMiddleware],
  });
}

async function terminatingMiddleware(
  _context: BackendContext,
  operation: AdminClientOperation<AdminClientOperationName>
): Promise<void> {
  switch (operation.name) {
    case AdminClientOperationName.archiveEntity: {
      const {
        args: [reference],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.archiveEntity>;
      const body: EntityArchiveRequest = {};
      const result = await fetchJsonResult<
        PublishingResultResponse,
        ErrorType.BadRequest | ErrorType.NotFound
      >([ErrorType.BadRequest, ErrorType.NotFound], urls.archiveEntity(reference.id), {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      resolve(result);
      break;
    }
    case AdminClientOperationName.createEntity: {
      const {
        args: [entity],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.createEntity>;
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
        resolve(ok(result.value.item));
      } else {
        resolve(result);
      }
      break;
    }
    case AdminClientOperationName.getEntities: {
      const {
        args: [references],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.getEntities>;
      //TODO add support for fetching multiple entities at once
      const result: Result<AdminEntity, ErrorType.NotFound | ErrorType.Generic>[] = [];
      for (const reference of references) {
        const itemResult = await fetchJsonResult<EntityResponse, ErrorType.NotFound>(
          [ErrorType.NotFound],
          urls.getEntity(reference)
        );
        result.push(itemResult.isOk() ? ok(itemResult.value.item) : itemResult);
      }
      resolve(result);
      break;
    }
    case AdminClientOperationName.getEntity: {
      const {
        args: [reference],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.getEntity>;
      const result = await fetchJsonResult<EntityResponse, ErrorType.NotFound>(
        [ErrorType.NotFound],
        urls.getEntity(reference)
      );
      if (result.isOk()) {
        resolve(ok(result.value.item));
      } else {
        resolve(result);
      }
      break;
    }
    case AdminClientOperationName.getEntityHistory: {
      const {
        args: [reference],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.getEntityHistory>;
      const result = await fetchJsonResult<EntityHistoryResponse, ErrorType.NotFound>(
        [ErrorType.NotFound],
        urls.getEntityHistory(reference.id)
      );
      if (result.isOk()) {
        resolve(ok(convertJsonEntityHistory(result.value)));
      } else {
        resolve(result);
      }
      break;
    }
    case AdminClientOperationName.getPublishingHistory: {
      const {
        args: [reference],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.getPublishingHistory>;
      const result = await fetchJsonResult<PublishingHistoryResponse, ErrorType.NotFound>(
        [ErrorType.NotFound],
        urls.getPublishingHistory(reference.id)
      );
      if (result.isOk()) {
        resolve(ok(convertJsonPublishingHistory(result.value)));
      } else {
        resolve(result);
      }
      break;
    }
    case AdminClientOperationName.getTotalCount: {
      const {
        args: [query],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.getTotalCount>;
      const result = await fetchJsonResult<TotalCountResponse, ErrorType.BadRequest>(
        [ErrorType.BadRequest],
        urls.totalCount(query)
      );
      if (result.isOk()) {
        resolve(ok(result.value.totalCount));
      } else {
        resolve(result);
      }
      break;
    }
    case AdminClientOperationName.publishEntities: {
      const {
        args: [references],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.publishEntities>;
      const body: EntityPublishRequest = { items: references };
      const result = await fetchJsonResult<
        PublishingResultListResponse,
        ErrorType.BadRequest | ErrorType.NotFound
      >([ErrorType.BadRequest, ErrorType.NotFound], urls.publishEntities, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      resolve(result);
      break;
    }
    case AdminClientOperationName.searchEntities: {
      const {
        args: [query, paging],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.searchEntities>;
      const result = await fetchJsonResult<SearchEntitiesResponse, ErrorType.BadRequest>(
        [ErrorType.BadRequest],
        urls.searchEntities(query, paging)
      );
      if (result.isOk()) {
        resolve(ok(convertJsonConnection(result.value, convertJsonEdge)));
      } else {
        resolve(result);
      }
      break;
    }
    case AdminClientOperationName.unarchiveEntity: {
      const {
        args: [reference],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.unarchiveEntity>;
      const body: EntityUnarchiveRequest = {};
      const result = await fetchJsonResult<
        PublishingResultResponse,
        ErrorType.BadRequest | ErrorType.NotFound
      >([ErrorType.BadRequest, ErrorType.NotFound], urls.unarchiveEntity(reference.id), {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      resolve(result);
      break;
    }
    case AdminClientOperationName.unpublishEntities: {
      const {
        args: [references],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.unpublishEntities>;
      const body: EntityUnpublishRequest = { items: references.map(({ id }) => id) };
      const result = await fetchJsonResult<
        PublishingResultListResponse,
        ErrorType.BadRequest | ErrorType.NotFound
      >([ErrorType.BadRequest, ErrorType.NotFound], urls.unpublishEntities, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      resolve(result);
      break;
    }
    case AdminClientOperationName.updateEntity: {
      const {
        args: [entity],
        resolve,
      } = operation as AdminClientOperation<AdminClientOperationName.updateEntity>;
      const body: EntityUpdateRequest = { item: entity };
      const result = await fetchJsonResult<
        EntityResponse,
        ErrorType.BadRequest | ErrorType.NotFound
      >(
        [ErrorType.BadRequest, ErrorType.NotFound],
        urls.getEntity({ id: entity.id }), //TODO
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (result.isOk()) {
        resolve(ok(result.value.item));
      } else {
        resolve(result);
      }
      break;
    }
    default:
      assertExhaustive(operation.name);
  }
}
