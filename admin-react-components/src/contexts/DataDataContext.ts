import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminQuery,
  Connection,
  Edge,
  EntityHistory,
  ErrorResult,
  FieldSpecification,
  Paging,
  PromiseResult,
  PublishHistory,
  Schema,
} from '@datadata/core';
import { createErrorResultFromError, ErrorType } from '@datadata/core';
import { createContext } from 'react';
import useSWR, { mutate } from 'swr';
import type { EditorJsToolSettings } from '..';

export interface DataDataContextAdapter {
  getEditorJSConfig(
    fieldSpec: FieldSpecification,
    standardBlockTools: { [toolName: string]: EditorJsToolSettings },
    standardInlineTools: string[]
  ): { tools: { [toolName: string]: EditorJsToolSettings }; inlineToolbar: string[] };

  getEntity(
    id: string,
    version?: number | null
  ): PromiseResult<AdminEntity, ErrorType.NotFound | ErrorType.Generic>;
  getEntityHistory(
    id: string
  ): PromiseResult<EntityHistory, ErrorType.NotFound | ErrorType.Generic>;
  getPublishHistory(
    id: string
  ): PromiseResult<PublishHistory, ErrorType.NotFound | ErrorType.Generic>;
  searchEntities(
    query?: AdminQuery,
    paging?: Paging
  ): PromiseResult<
    Connection<Edge<AdminEntity, ErrorType>> | null,
    ErrorType.BadRequest | ErrorType.Generic
  >;
  createEntity(
    entity: AdminEntityCreate
  ): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.Generic>;
  updateEntity(
    entity: AdminEntityUpdate
  ): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic>;
  publishEntities(
    entities: {
      id: string;
      version: number;
    }[]
  ): PromiseResult<void, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic>;
  unpublishEntities(
    entityIds: string[]
  ): PromiseResult<void, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic>;
}

enum FetcherActions {
  UseEntity,
  UseEntityHistory,
  UsePublishHistory,
  UseSearchEntities,
}

export class DataDataContextValue {
  #adapter: DataDataContextAdapter;
  #schema: Schema;
  /** Used to enable different cache keys for SWR */
  #rootKey: string | undefined;

  constructor(adapter: DataDataContextAdapter, schema: Schema, rootKey?: string) {
    this.#adapter = adapter;
    this.#schema = schema;
    this.#rootKey = rootKey;
  }

  getEditorJSConfig = (
    fieldSpec: FieldSpecification,
    standardBlockTools: { [toolName: string]: EditorJsToolSettings },
    standardInlineTools: string[]
  ): { tools: { [toolName: string]: EditorJsToolSettings }; inlineToolbar: string[] } => {
    return this.#adapter.getEditorJSConfig(fieldSpec, standardBlockTools, standardInlineTools);
  };

  get schema(): Schema {
    return this.#schema;
  }

  /** Loads an entity. If `id` is `undefined` no data is fetched */
  useEntity = (
    id: string | undefined,
    version?: number | null
  ): {
    entity?: AdminEntity;
    entityError?: ErrorResult<unknown, ErrorType.NotFound | ErrorType.Generic>;
  } => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR(
      id ? [this.#rootKey, FetcherActions.UseEntity, id, version ?? null] : null,
      this.fetcher
    );

    const entityError = error ? createErrorResultFromError(error, [ErrorType.NotFound]) : undefined;
    return { entity: data as AdminEntity | undefined, entityError };
  };

  /** Loads the history for an entity. If `id` is `undefined` no data is fetched */
  useEntityHistory = (
    id: string | undefined
  ): {
    entityHistory?: EntityHistory;
    entityHistoryError?: ErrorResult<unknown, ErrorType.NotFound | ErrorType.Generic>;
  } => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR(
      id ? [this.#rootKey, FetcherActions.UseEntityHistory, id] : null,
      this.fetcher
    );

    const entityHistoryError = error
      ? createErrorResultFromError(error, [ErrorType.NotFound])
      : undefined;
    return {
      entityHistory: data as EntityHistory | undefined,
      entityHistoryError,
    };
  };

  /** Loads the publish history for an entity. If `id` is `undefined` no data is fetched */
  usePublishHistory = (
    id: string | undefined
  ): {
    publishHistory?: PublishHistory;
    publishHistoryError?: ErrorResult<unknown, ErrorType.NotFound | ErrorType.Generic>;
  } => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR(
      id ? [this.#rootKey, FetcherActions.UsePublishHistory, id] : null,
      this.fetcher
    );

    const publishHistoryError = error
      ? createErrorResultFromError(error, [ErrorType.NotFound])
      : undefined;
    return {
      publishHistory: data as PublishHistory | undefined,
      publishHistoryError,
    };
  };

  /** Searches for entities. If `query` is `undefined` no data is fetched */
  useSearchEntities = (
    query?: AdminQuery,
    paging?: Paging
  ): {
    connection?: Connection<Edge<AdminEntity, ErrorType>> | null;
    connectionError?: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic>;
  } => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR(
      query
        ? [this.#rootKey, FetcherActions.UseSearchEntities, JSON.stringify({ query, paging })]
        : null,
      this.fetcher
    );

    const connectionError = error
      ? createErrorResultFromError(error, [ErrorType.BadRequest])
      : undefined;
    return {
      connection: data as Connection<Edge<AdminEntity, ErrorType>> | undefined,
      connectionError,
    };
  };

  createEntity = async (
    entity: AdminEntityCreate
  ): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.Generic> => {
    try {
      const result = await this.#adapter.createEntity(entity);
      if (result.isOk()) {
        this.invalidateEntity(result.value);
      }
      return result;
    } catch (error) {
      return createErrorResultFromError(error, [ErrorType.BadRequest]);
    }
  };

  updateEntity = async (
    entity: AdminEntityUpdate
  ): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic> => {
    try {
      const result = await this.#adapter.updateEntity(entity);
      if (result.isOk()) {
        this.invalidateEntity(result.value);
      }
      return result;
    } catch (error) {
      return createErrorResultFromError(error, [ErrorType.BadRequest, ErrorType.NotFound]);
    }
  };

  publishEntities = async (
    entities: {
      id: string;
      version: number;
    }[]
  ): PromiseResult<void, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic> => {
    try {
      const result = await this.#adapter.publishEntities(entities);
      if (result.isOk()) {
        for (const entity of entities) {
          this.invalidateEntityPublished(entity.id);
        }
      }
      return result;
    } catch (error) {
      return createErrorResultFromError(error, [ErrorType.BadRequest, ErrorType.NotFound]);
    }
  };

  unpublishEntities = async (
    entityIds: string[]
  ): PromiseResult<void, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic> => {
    try {
      const result = await this.#adapter.unpublishEntities(entityIds);
      if (result.isOk()) {
        for (const entityId of entityIds) {
          this.invalidateEntityPublished(entityId);
        }
      }
      return result;
    } catch (error) {
      return createErrorResultFromError(error, [ErrorType.BadRequest, ErrorType.NotFound]);
    }
  };

  private invalidateEntity(entity: AdminEntity) {
    mutate([this.#rootKey, FetcherActions.UseEntity, entity.id, null], entity, false);
    mutate([this.#rootKey, FetcherActions.UseEntityHistory, entity.id]);
  }

  private invalidateEntityPublished(id: string) {
    mutate([this.#rootKey, FetcherActions.UseEntityHistory, id]);
    mutate([this.#rootKey, FetcherActions.UsePublishHistory, id]);
    // for publish state
    mutate([this.#rootKey, FetcherActions.UseEntity, id, null]);
  }

  private fetcher = async (
    _rootKey: string | undefined,
    action: FetcherActions,
    ...args: unknown[]
  ) => {
    switch (action) {
      case FetcherActions.UseEntity: {
        const [id, version] = args as [string, number | null | undefined];
        const result = await this.#adapter.getEntity(id, version);
        if (result.isError()) {
          throw result.toError();
        }
        return result.value;
      }
      case FetcherActions.UseEntityHistory: {
        const [id] = args as [string];
        const result = await this.#adapter.getEntityHistory(id);
        if (result.isError()) {
          throw result.toError();
        }
        return result.value;
      }
      case FetcherActions.UsePublishHistory: {
        const [id] = args as [string];
        const result = await this.#adapter.getPublishHistory(id);
        if (result.isError()) {
          throw result.toError();
        }
        return result.value;
      }
      case FetcherActions.UseSearchEntities: {
        const [json] = args as [string];
        const { query, paging }: { query: AdminQuery; paging: Paging | undefined } =
          JSON.parse(json);
        const result = await this.#adapter.searchEntities(query, paging);
        if (result.isError()) {
          throw result.toError();
        }
        return result.value;
      }
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  };
}

export const DataDataContext = createContext<DataDataContextValue>({
  defaultContextValue: true,
} as unknown as DataDataContextValue);
DataDataContext.displayName = 'DataDataContext';
