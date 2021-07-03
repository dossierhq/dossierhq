import type {
  AdminEntity2,
  AdminEntityCreate2,
  AdminEntityUpdate2,
  AdminQuery,
  Connection,
  Edge,
  EntityHistory,
  ErrorResult,
  FieldSpecification,
  Paging,
  PromiseResult,
  PublishingHistory,
  PublishingResult,
  Schema,
} from '@datadata/core';
import { assertExhaustive, createErrorResultFromError, ErrorType } from '@datadata/core';
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
  ): PromiseResult<AdminEntity2, ErrorType.NotFound | ErrorType.Generic>;
  getEntityHistory(
    id: string
  ): PromiseResult<EntityHistory, ErrorType.NotFound | ErrorType.Generic>;
  getPublishingHistory(
    id: string
  ): PromiseResult<PublishingHistory, ErrorType.NotFound | ErrorType.Generic>;
  searchEntities(
    query?: AdminQuery,
    paging?: Paging
  ): PromiseResult<
    Connection<Edge<AdminEntity2, ErrorType>> | null,
    ErrorType.BadRequest | ErrorType.Generic
  >;
  createEntity(
    entity: AdminEntityCreate2
  ): PromiseResult<AdminEntity2, ErrorType.BadRequest | ErrorType.Generic>;
  updateEntity(
    entity: AdminEntityUpdate2
  ): PromiseResult<AdminEntity2, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic>;
  publishEntities(
    entities: {
      id: string;
      version: number;
    }[]
  ): PromiseResult<
    PublishingResult[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  >;
  unpublishEntities(
    entityIds: string[]
  ): PromiseResult<
    PublishingResult[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  >;
  archiveEntity(
    entityId: string
  ): PromiseResult<PublishingResult, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic>;
  unarchiveEntity(
    entityId: string
  ): PromiseResult<PublishingResult, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic>;
}

enum FetcherActions {
  UseEntity,
  UseEntityHistory,
  UsePublishingHistory,
  UseSearchEntities,
}

interface FetcherActionReturn {
  [FetcherActions.UseEntity]: AdminEntity2;
  [FetcherActions.UseEntityHistory]: EntityHistory;
  [FetcherActions.UsePublishingHistory]: PublishingHistory;
  [FetcherActions.UseSearchEntities]: Connection<Edge<AdminEntity2, ErrorType>> | null;
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
    entity?: AdminEntity2;
    entityError?: ErrorResult<unknown, ErrorType.NotFound | ErrorType.Generic>;
  } => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR<FetcherActionReturn[FetcherActions.UseEntity]>(
      id ? [this.#rootKey, FetcherActions.UseEntity, id, version ?? null] : null,
      this.fetcher
    );

    const entityError = error ? createErrorResultFromError(error, [ErrorType.NotFound]) : undefined;
    return { entity: data, entityError };
  };

  /** Loads the history for an entity. If `id` is `undefined` no data is fetched */
  useEntityHistory = (
    id: string | undefined
  ): {
    entityHistory?: EntityHistory;
    entityHistoryError?: ErrorResult<unknown, ErrorType.NotFound | ErrorType.Generic>;
  } => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR<FetcherActionReturn[FetcherActions.UseEntityHistory]>(
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
  usePublishingHistory = (
    id: string | undefined
  ): {
    publishingHistory?: PublishingHistory;
    publishingHistoryError?: ErrorResult<unknown, ErrorType.NotFound | ErrorType.Generic>;
  } => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR<FetcherActionReturn[FetcherActions.UsePublishingHistory]>(
      id ? [this.#rootKey, FetcherActions.UsePublishingHistory, id] : null,
      this.fetcher
    );

    const publishingHistoryError = error
      ? createErrorResultFromError(error, [ErrorType.NotFound])
      : undefined;
    return {
      publishingHistory: data as PublishingHistory | undefined,
      publishingHistoryError,
    };
  };

  /** Searches for entities. If `query` is `undefined` no data is fetched */
  useSearchEntities = (
    query?: AdminQuery,
    paging?: Paging
  ): {
    connection?: Connection<Edge<AdminEntity2, ErrorType>> | null;
    connectionError?: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic>;
  } => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR<FetcherActionReturn[FetcherActions.UseSearchEntities]>(
      query
        ? [this.#rootKey, FetcherActions.UseSearchEntities, JSON.stringify({ query, paging })]
        : null,
      this.fetcher
    );

    const connectionError = error
      ? createErrorResultFromError(error, [ErrorType.BadRequest])
      : undefined;
    return {
      connection: data as Connection<Edge<AdminEntity2, ErrorType>> | undefined,
      connectionError,
    };
  };

  createEntity = async (
    entity: AdminEntityCreate2
  ): PromiseResult<AdminEntity2, ErrorType.BadRequest | ErrorType.Generic> => {
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
    entity: AdminEntityUpdate2
  ): PromiseResult<AdminEntity2, ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic> => {
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
  ): PromiseResult<
    PublishingResult[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  > => {
    try {
      const result = await this.#adapter.publishEntities(entities);
      if (result.isOk()) {
        for (const publishResult of result.value) {
          this.invalidateAfterPublishingEvent(publishResult);
        }
      }
      return result;
    } catch (error) {
      return createErrorResultFromError(error, [ErrorType.BadRequest, ErrorType.NotFound]);
    }
  };

  unpublishEntities = async (
    entityIds: string[]
  ): PromiseResult<
    PublishingResult[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  > => {
    try {
      const result = await this.#adapter.unpublishEntities(entityIds);
      if (result.isOk()) {
        for (const publishResult of result.value) {
          this.invalidateAfterPublishingEvent(publishResult);
        }
      }
      return result;
    } catch (error) {
      return createErrorResultFromError(error, [ErrorType.BadRequest, ErrorType.NotFound]);
    }
  };

  archiveEntity = async (
    id: string
  ): PromiseResult<
    PublishingResult,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  > => {
    try {
      const result = await this.#adapter.archiveEntity(id);
      if (result.isOk()) {
        this.invalidateAfterPublishingEvent(result.value);
      }
      return result;
    } catch (error) {
      return createErrorResultFromError(error, [ErrorType.BadRequest, ErrorType.NotFound]);
    }
  };

  unarchiveEntity = async (
    id: string
  ): PromiseResult<
    PublishingResult,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  > => {
    try {
      const result = await this.#adapter.unarchiveEntity(id);
      if (result.isOk()) {
        this.invalidateAfterPublishingEvent(result.value);
      }
      return result;
    } catch (error) {
      return createErrorResultFromError(error, [ErrorType.BadRequest, ErrorType.NotFound]);
    }
  };

  private invalidateEntity(entity: AdminEntity2) {
    mutate([this.#rootKey, FetcherActions.UseEntity, entity.id, null], entity, false);
    mutate([this.#rootKey, FetcherActions.UseEntityHistory, entity.id]);
  }

  private invalidateAfterPublishingEvent(publishingResult: PublishingResult) {
    const { id, publishState } = publishingResult;
    mutate([this.#rootKey, FetcherActions.UseEntityHistory, id]);
    mutate([this.#rootKey, FetcherActions.UsePublishingHistory, id]);
    mutate(
      [this.#rootKey, FetcherActions.UseEntity, id, null],
      (cachedValue: AdminEntity2 | undefined) => {
        if (cachedValue) {
          const updatedValue: AdminEntity2 = {
            ...cachedValue,
            info: { ...cachedValue.info, publishingState: publishState },
          };
          return updatedValue;
        }
        return undefined;
      }
    );
  }

  private fetcher = async <T extends FetcherActions>(
    _rootKey: string | undefined,
    action: T,
    ...args: unknown[]
  ): Promise<FetcherActionReturn[T]> => {
    switch (action) {
      case FetcherActions.UseEntity: {
        const [id, version] = args as [string, number | null | undefined];
        const result = await this.#adapter.getEntity(id, version);
        if (result.isError()) {
          throw result.toError();
        }
        return result.value as FetcherActionReturn[T];
      }
      case FetcherActions.UseEntityHistory: {
        const [id] = args as [string];
        const result = await this.#adapter.getEntityHistory(id);
        if (result.isError()) {
          throw result.toError();
        }
        return result.value as FetcherActionReturn[T];
      }
      case FetcherActions.UsePublishingHistory: {
        const [id] = args as [string];
        const result = await this.#adapter.getPublishingHistory(id);
        if (result.isError()) {
          throw result.toError();
        }
        return result.value as FetcherActionReturn[T];
      }
      case FetcherActions.UseSearchEntities: {
        const [json] = args as [string];
        const { query, paging }: { query: AdminQuery; paging: Paging | undefined } =
          JSON.parse(json);
        const result = await this.#adapter.searchEntities(query, paging);
        if (result.isError()) {
          throw result.toError();
        }
        return result.value as FetcherActionReturn[T];
      }
      default:
        assertExhaustive(action as never);
    }
  };
}

export const DataDataContext = createContext<DataDataContextValue>({
  defaultContextValue: true,
} as unknown as DataDataContextValue);
DataDataContext.displayName = 'DataDataContext';
