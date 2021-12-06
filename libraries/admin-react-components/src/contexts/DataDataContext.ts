import type {
  AdminClient,
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminQuery,
  AdminSchema,
  Connection,
  Edge,
  EntityHistory,
  EntityPublishPayload,
  ErrorResult,
  FieldSpecification,
  Logger,
  Paging,
  PromiseResult,
  PublishingHistory,
} from '@jonasb/datadata-core';
import { assertExhaustive, createErrorResultFromError, ErrorType } from '@jonasb/datadata-core';
import { createContext } from 'react';
import useSWR, { mutate } from 'swr';
import type { DataDataContextAdapter, DisplayAuthKey, EditorJsToolSettings } from '..';

//TODO remove file when migrated to DataDataContext2

enum FetcherActions {
  UseEntity,
  UseEntityHistory,
  UsePublishingHistory,
  UseSearchEntities,
}

interface FetcherActionReturn {
  [FetcherActions.UseEntity]: AdminEntity;
  [FetcherActions.UseEntityHistory]: EntityHistory;
  [FetcherActions.UsePublishingHistory]: PublishingHistory;
  [FetcherActions.UseSearchEntities]: Connection<Edge<AdminEntity, ErrorType>> | null;
}

export class DataDataContextValue {
  #adapter: DataDataContextAdapter;
  #adminClient: AdminClient;
  #schema: AdminSchema;
  #authKeys: DisplayAuthKey[];
  #logger: Logger;
  /** Used to enable different cache keys for SWR */
  #rootKey: string | undefined;

  constructor(
    adapter: DataDataContextAdapter,
    adminClient: AdminClient,
    schema: AdminSchema,
    logger: Logger,
    authKeys: DisplayAuthKey[],
    rootKey?: string
  ) {
    this.#adapter = adapter;
    this.#adminClient = adminClient;
    //TODO fetch schema from adminClient?
    this.#schema = schema;
    this.#authKeys = authKeys;
    this.#logger = logger;
    this.#rootKey = rootKey;
  }

  getEditorJSConfig = (
    fieldSpec: FieldSpecification,
    standardBlockTools: { [toolName: string]: EditorJsToolSettings },
    standardInlineTools: string[]
  ): { tools: { [toolName: string]: EditorJsToolSettings }; inlineToolbar: string[] } => {
    return this.#adapter.getEditorJSConfig(fieldSpec, standardBlockTools, standardInlineTools);
  };

  get schema(): AdminSchema {
    return this.#schema;
  }

  get authKeys(): DisplayAuthKey[] {
    return this.#authKeys;
  }

  /** Loads an entity. If `id` is `undefined` no data is fetched */
  useEntity = (
    id: string | undefined,
    version?: number | null
  ): {
    entity?: AdminEntity;
    entityError?: ErrorResult<unknown, ErrorType.NotFound | ErrorType.Generic>;
  } => {
    const { data, error } = useSWR<FetcherActionReturn[FetcherActions.UseEntity]>(
      id ? [this.#rootKey, FetcherActions.UseEntity, id, version ?? null] : null,
      this.fetcher
    );

    const entityError = error
      ? createErrorResultFromError({ logger: this.#logger }, error, [ErrorType.NotFound])
      : undefined;
    return { entity: data, entityError };
  };

  /** Loads the history for an entity. If `id` is `undefined` no data is fetched */
  useEntityHistory = (
    id: string | undefined
  ): {
    entityHistory?: EntityHistory;
    entityHistoryError?: ErrorResult<unknown, ErrorType.NotFound | ErrorType.Generic>;
  } => {
    const { data, error } = useSWR<FetcherActionReturn[FetcherActions.UseEntityHistory]>(
      id ? [this.#rootKey, FetcherActions.UseEntityHistory, id] : null,
      this.fetcher
    );

    const entityHistoryError = error
      ? createErrorResultFromError({ logger: this.#logger }, error, [ErrorType.NotFound])
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
    const { data, error } = useSWR<FetcherActionReturn[FetcherActions.UsePublishingHistory]>(
      id ? [this.#rootKey, FetcherActions.UsePublishingHistory, id] : null,
      this.fetcher
    );

    const publishingHistoryError = error
      ? createErrorResultFromError({ logger: this.#logger }, error, [ErrorType.NotFound])
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
    connection?: Connection<Edge<AdminEntity, ErrorType>> | null;
    connectionError?: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic>;
  } => {
    const { data, error } = useSWR<FetcherActionReturn[FetcherActions.UseSearchEntities]>(
      query
        ? [this.#rootKey, FetcherActions.UseSearchEntities, JSON.stringify({ query, paging })]
        : null,
      this.fetcher
    );

    const connectionError = error
      ? createErrorResultFromError({ logger: this.#logger }, error, [ErrorType.BadRequest])
      : undefined;
    return {
      connection: data as Connection<Edge<AdminEntity, ErrorType>> | undefined,
      connectionError,
    };
  };

  createEntity = async (
    entity: AdminEntityCreate
  ): PromiseResult<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.Conflict | ErrorType.NotAuthorized | ErrorType.Generic
  > => {
    try {
      const result = await this.#adminClient.createEntity(entity);
      if (result.isError()) {
        return result;
      }
      this.invalidateEntity(result.value.entity);
      return result.map((payload) => payload.entity);
    } catch (error) {
      return createErrorResultFromError({ logger: this.#logger }, error, [ErrorType.BadRequest]);
    }
  };

  updateEntity = async (
    entity: AdminEntityUpdate
  ): PromiseResult<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  > => {
    try {
      const result = await this.#adminClient.updateEntity(entity);
      if (result.isError()) {
        return result;
      }
      if (result.value.effect !== 'none') {
        this.invalidateEntity(result.value.entity);
      }
      return result.map((payload) => payload.entity);
    } catch (error) {
      return createErrorResultFromError({ logger: this.#logger }, error, [
        ErrorType.BadRequest,
        ErrorType.NotFound,
      ]);
    }
  };

  publishEntities = async (
    entities: {
      id: string;
      version: number;
    }[]
  ): PromiseResult<
    EntityPublishPayload[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  > => {
    try {
      const result = await this.#adminClient.publishEntities(entities);
      if (result.isOk()) {
        for (const publishResult of result.value) {
          this.invalidateAfterPublishingEvent(publishResult);
        }
      }
      return result;
    } catch (error) {
      return createErrorResultFromError({ logger: this.#logger }, error, [
        ErrorType.BadRequest,
        ErrorType.NotFound,
      ]);
    }
  };

  unpublishEntities = async (
    entityIds: string[]
  ): PromiseResult<
    EntityPublishPayload[],
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  > => {
    try {
      const result = await this.#adminClient.unpublishEntities(entityIds.map((id) => ({ id })));
      if (result.isOk()) {
        for (const publishResult of result.value) {
          this.invalidateAfterPublishingEvent(publishResult);
        }
      }
      return result;
    } catch (error) {
      return createErrorResultFromError({ logger: this.#logger }, error, [
        ErrorType.BadRequest,
        ErrorType.NotFound,
      ]);
    }
  };

  archiveEntity = async (
    id: string
  ): PromiseResult<
    EntityPublishPayload,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  > => {
    try {
      const result = await this.#adminClient.archiveEntity({ id });
      if (result.isOk()) {
        this.invalidateAfterPublishingEvent(result.value);
      }
      return result;
    } catch (error) {
      return createErrorResultFromError({ logger: this.#logger }, error, [
        ErrorType.BadRequest,
        ErrorType.NotFound,
      ]);
    }
  };

  unarchiveEntity = async (
    id: string
  ): PromiseResult<
    EntityPublishPayload,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
  > => {
    try {
      const result = await this.#adminClient.unarchiveEntity({ id });
      if (result.isOk()) {
        this.invalidateAfterPublishingEvent(result.value);
      }
      return result;
    } catch (error) {
      return createErrorResultFromError({ logger: this.#logger }, error, [
        ErrorType.BadRequest,
        ErrorType.NotFound,
      ]);
    }
  };

  private invalidateEntity(entity: AdminEntity) {
    mutate([this.#rootKey, FetcherActions.UseEntity, entity.id, null], entity, false);
    mutate([this.#rootKey, FetcherActions.UseEntityHistory, entity.id]);
  }

  private invalidateAfterPublishingEvent(publishingResult: EntityPublishPayload) {
    const { id, publishState } = publishingResult;
    mutate([this.#rootKey, FetcherActions.UseEntityHistory, id]);
    mutate([this.#rootKey, FetcherActions.UsePublishingHistory, id]);
    mutate(
      [this.#rootKey, FetcherActions.UseEntity, id, null],
      (cachedValue: AdminEntity | undefined) => {
        if (cachedValue) {
          const updatedValue: AdminEntity = {
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
        const result = await this.#adminClient.getEntity(
          typeof version === 'number' ? { id, version } : { id }
        );
        if (result.isError()) {
          throw result.toError();
        }
        return result.value as FetcherActionReturn[T];
      }
      case FetcherActions.UseEntityHistory: {
        const [id] = args as [string];
        const result = await this.#adminClient.getEntityHistory({ id });
        if (result.isError()) {
          throw result.toError();
        }
        return result.value as FetcherActionReturn[T];
      }
      case FetcherActions.UsePublishingHistory: {
        const [id] = args as [string];
        const result = await this.#adminClient.getPublishingHistory({ id });
        if (result.isError()) {
          throw result.toError();
        }
        return result.value as FetcherActionReturn[T];
      }
      case FetcherActions.UseSearchEntities: {
        const [json] = args as [string];
        const { query, paging }: { query: AdminQuery; paging: Paging | undefined } =
          JSON.parse(json);
        const result = await this.#adminClient.searchEntities(query, paging);
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
