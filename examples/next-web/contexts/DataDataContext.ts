import type {
  DataDataContextAdapter,
  EditorJsToolSettings,
} from '@datadata/admin-react-components';
import { DataDataContextValue } from '@datadata/admin-react-components';
import {
  convertJsonConnection,
  convertJsonEdge,
  convertJsonEntityHistory,
  convertJsonPublishingHistory,
  ErrorType,
  ok,
  Schema,
} from '@datadata/core';
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
  ActionResponse,
  EntityHistoryResponse,
  EntityResponse,
  PublishingHistoryResponse,
  SchemaResponse,
  SearchEntitiesResponse,
} from '../types/ResponseTypes';
import { fetchJson, fetchJsonResult, urls } from '../utils/BackendUtils';
import customTools from './EditorJsTools';

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
      return ok(convertJsonEntityHistory(result.value));
    }
    return result;
  };

  getPublishingHistory: DataDataContextAdapter['getPublishingHistory'] = async (id) => {
    const result = await fetchJsonResult<PublishingHistoryResponse, ErrorType.NotFound>(
      [ErrorType.NotFound],
      urls.getPublishingHistory(id)
    );
    if (result.isOk()) {
      return ok(convertJsonPublishingHistory(result.value));
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

  publishEntities: DataDataContextAdapter['publishEntities'] = async (entities) => {
    const body: EntityPublishRequest = { items: entities };
    const result = await fetchJsonResult<ActionResponse, ErrorType.BadRequest | ErrorType.NotFound>(
      [ErrorType.BadRequest, ErrorType.NotFound],
      urls.publishEntities,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (result.isOk()) {
      return ok(undefined);
    }
    return result;
  };

  unpublishEntities: DataDataContextAdapter['unpublishEntities'] = async (entityIds) => {
    const body: EntityUnpublishRequest = { items: entityIds };
    const result = await fetchJsonResult<ActionResponse, ErrorType.BadRequest | ErrorType.NotFound>(
      [ErrorType.BadRequest, ErrorType.NotFound],
      urls.unpublishEntities,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (result.isOk()) {
      return ok(undefined);
    }
    return result;
  };

  archiveEntity: DataDataContextAdapter['archiveEntity'] = async (entityId) => {
    const body: EntityArchiveRequest = {};
    const result = await fetchJsonResult<ActionResponse, ErrorType.BadRequest | ErrorType.NotFound>(
      [ErrorType.BadRequest, ErrorType.NotFound],
      urls.archiveEntity(entityId),
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (result.isOk()) {
      return ok(undefined);
    }
    return result;
  };

  unarchiveEntity: DataDataContextAdapter['unarchiveEntity'] = async (entityId) => {
    const body: EntityUnarchiveRequest = {};
    const result = await fetchJsonResult<ActionResponse, ErrorType.BadRequest | ErrorType.NotFound>(
      [ErrorType.BadRequest, ErrorType.NotFound],
      urls.unarchiveEntity(entityId),
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
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
