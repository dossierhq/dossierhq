import {
  AdminSchemaWithMigrations,
  EventType,
  NoOpLogger,
  notOk,
  ok,
  type AdminClient,
  type AdminClientMiddleware,
  type AdminEntity,
  type AdminEntityProcessDirtyPayload,
  type AdminSchemaSpecificationWithMigrations,
  type Component,
  type Connection,
  type ContextProvider,
  type Edge,
  type EntityReference,
  type ErrorType,
  type Logger,
  type Paging,
  type PromiseResult,
  type PublishedClient,
  type PublishedClientMiddleware,
  type PublishedEntity,
  type PublishedSchema,
  type Result,
  type SyncEvent,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseOptimizationOptions,
  DatabasePerformanceCallbacks,
  ReadOnlySession,
  Session,
  WriteSession,
} from '@dossierhq/database-adapter';
import {
  authCreateSession,
  authCreateSyncSessionForSubject,
  verifyAuthKeysFormat,
} from './Auth.js';
import { DefaultAuthorizationAdapter, type AuthorizationAdapter } from './AuthorizationAdapter.js';
import {
  InternalContextImpl,
  SessionContextImpl,
  type InternalContext,
  type SessionContext,
} from './Context.js';
import { createServerAdminClient } from './ServerAdminClient.js';
import { createServerPublishedClient } from './ServerPublishedClient.js';
import { authCreatePrincipal } from './auth/authCreatePrincipal.js';
import { autGetPrincipals } from './auth/authGetPrincipals.js';
import { autGetPrincipalsTotalCount } from './auth/authGetPrincipalsTotalCount.js';
import {
  managementApplyAuthSyncEvent,
  managementApplySyncEvent,
} from './management/managementApplySyncEvent.js';
import { managementDirtyProcessNextEntity } from './management/managementDirtyProcessNextEntity.js';
import {
  managementGetSyncEvents,
  type SyncEventQuery,
  type SyncEventsPayload,
} from './management/managementGetSyncEvents.js';
import { schemaGetSpecification } from './schema/schemaGetSpecification.js';
import { assertIsDefined } from './utils/AssertUtils.js';

export interface CreateSessionPayload<TSession extends Session = Session> {
  principalEffect: 'created' | 'none';
  context: SessionContext<TSession>;
}

export interface SyncPrincipal {
  provider: string;
  identifier: string;
  subjectId: string;
}

export interface Server<
  TDatabaseOptimizationOptions extends DatabaseOptimizationOptions = DatabaseOptimizationOptions,
> {
  shutdown(): PromiseResult<void, typeof ErrorType.Generic>;

  addPlugin(plugin: ServerPlugin): void;

  reloadSchema(): PromiseResult<boolean, typeof ErrorType.Generic>;

  optimizeDatabase(
    options: TDatabaseOptimizationOptions,
  ): PromiseResult<void, typeof ErrorType.Generic>;

  processNextDirtyEntity(
    filter?: EntityReference,
  ): PromiseResult<AdminEntityProcessDirtyPayload | null, typeof ErrorType.Generic>;

  getSyncEvents(
    query: SyncEventQuery,
  ): PromiseResult<SyncEventsPayload, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

  applySyncEvent(
    event: SyncEvent,
  ): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

  getPrincipals(
    paging?: Paging,
  ): PromiseResult<
    Connection<Edge<SyncPrincipal, typeof ErrorType.Generic>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  getPrincipalsTotalCount(): PromiseResult<number, typeof ErrorType.Generic>;

  createPrincipal(
    principal: SyncPrincipal,
  ): PromiseResult<
    { effect: 'created' | 'none' },
    typeof ErrorType.Conflict | typeof ErrorType.Generic
  >;

  createSession(params: {
    provider: string;
    identifier: string;
    defaultAuthKeys?: readonly string[] | null;
    logger?: Logger | null;
    databasePerformance?: DatabasePerformanceCallbacks | null;
    readonly: true;
  }): PromiseResult<
    CreateSessionPayload<ReadOnlySession>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;
  createSession(params: {
    provider: string;
    identifier: string;
    defaultAuthKeys?: readonly string[] | null;
    logger?: Logger | null;
    databasePerformance?: DatabasePerformanceCallbacks | null;
    readonly?: boolean;
  }): PromiseResult<
    CreateSessionPayload<WriteSession>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >;

  createAdminClient<
    TClient extends AdminClient<
      AdminEntity<string, object>,
      Component<string, object>
    > = AdminClient,
  >(
    context: SessionContext | ContextProvider<SessionContext>,
    middleware?: AdminClientMiddleware<SessionContext>[],
  ): TClient;

  createPublishedClient<
    TClient extends PublishedClient<
      PublishedEntity<string, object>,
      Component<string, object>
    > = PublishedClient,
  >(
    context: SessionContext | ContextProvider<SessionContext>,
    middleware?: PublishedClientMiddleware<SessionContext>[],
  ): TClient;
}

export interface ServerPlugin {
  onCreateAdminClient(
    pipeline: AdminClientMiddleware<SessionContext>[],
  ): AdminClientMiddleware<SessionContext>[];

  onCreatePublishedClient(
    pipeline: PublishedClientMiddleware<SessionContext>[],
  ): PublishedClientMiddleware<SessionContext>[];

  onServerShutdown(): void;
}

export class ServerImpl {
  #databaseAdapter: DatabaseAdapter | null;
  #logger: Logger;
  #adminSchema: AdminSchemaWithMigrations | null = null;
  #publishedSchema: PublishedSchema | null = null;
  #plugins: ServerPlugin[] = [];

  constructor({ databaseAdapter, logger }: { databaseAdapter: DatabaseAdapter; logger?: Logger }) {
    this.#databaseAdapter = databaseAdapter;
    this.#logger = logger ?? NoOpLogger;
  }

  async shutdown(): PromiseResult<void, typeof ErrorType.Generic> {
    if (this.#databaseAdapter) {
      for (const plugin of this.#plugins) {
        plugin.onServerShutdown();
      }
      this.#plugins = [];

      this.#logger.info('Shutting down database adapter');
      await this.#databaseAdapter.disconnect();
      this.#databaseAdapter = null;
      this.#logger.info('Finished shutting server');
      return ok(undefined);
    }
    return notOk.Generic('Trying to shutdown twice');
  }

  async reloadSchema(context: InternalContext): PromiseResult<boolean, typeof ErrorType.Generic> {
    assertIsDefined(this.#databaseAdapter);
    const previousVersion = this.#adminSchema?.spec.version ?? -1;
    const result = await schemaGetSpecification(this.#databaseAdapter, context, true);
    if (result.isError()) return result;

    this.setAdminSchema(result.value);
    return ok(result.value.version !== previousVersion);
  }

  addPlugin(plugin: ServerPlugin): void {
    this.#plugins.push(plugin);
  }

  getAdminSchema(): AdminSchemaWithMigrations {
    if (!this.#adminSchema) {
      throw new Error('AdminSchema is not set');
    }
    return this.#adminSchema;
  }

  getPublishedSchema(): PublishedSchema {
    if (!this.#publishedSchema) {
      throw new Error('PublishedSchema is not set');
    }
    return this.#publishedSchema;
  }

  setAdminSchema(schemaSpec: AdminSchemaSpecificationWithMigrations): void {
    this.#adminSchema = new AdminSchemaWithMigrations(schemaSpec);
    this.#publishedSchema = this.#adminSchema.toPublishedSchema();
  }

  createInternalContext(databasePerformance: DatabasePerformanceCallbacks | null): InternalContext {
    assertIsDefined(this.#databaseAdapter);
    return new InternalContextImpl(this.#databaseAdapter, this.#logger, databasePerformance);
  }

  createSessionContext(
    session: Readonly<Session>,
    defaultAuthKeys: readonly string[] | null,
    logger: Logger | null,
    databasePerformance: DatabasePerformanceCallbacks | null,
  ): Result<SessionContext, typeof ErrorType.BadRequest> {
    assertIsDefined(this.#databaseAdapter);

    if (!defaultAuthKeys) {
      defaultAuthKeys = [''];
    }

    const verifyResult = verifyAuthKeysFormat(defaultAuthKeys);
    if (verifyResult.isError()) return verifyResult;

    return ok(
      new SessionContextImpl(
        session,
        defaultAuthKeys,
        this.#databaseAdapter,
        logger ?? this.#logger,
        databasePerformance,
      ),
    );
  }

  resolveAdminClientMiddleware(middleware: AdminClientMiddleware<SessionContext>[]) {
    for (const plugin of this.#plugins) {
      middleware = plugin.onCreateAdminClient(middleware);
    }
    return middleware;
  }

  resolvePublishedClientMiddleware(middleware: PublishedClientMiddleware<SessionContext>[]) {
    for (const plugin of this.#plugins) {
      middleware = plugin.onCreatePublishedClient(middleware);
    }
    return middleware;
  }
}

export async function createServer<
  TDatabaseOptimizationOptions extends DatabaseOptimizationOptions,
>({
  databaseAdapter,
  authorizationAdapter,
  logger: serverLogger,
}: {
  databaseAdapter: DatabaseAdapter<TDatabaseOptimizationOptions>;
  authorizationAdapter?: AuthorizationAdapter;
  logger?: Logger;
}): PromiseResult<Server<TDatabaseOptimizationOptions>, typeof ErrorType.Generic> {
  const serverImpl = new ServerImpl({
    databaseAdapter,
    logger: serverLogger,
  });
  const loadSchemaResult = await serverImpl.reloadSchema(serverImpl.createInternalContext(null));
  if (loadSchemaResult.isError()) return loadSchemaResult;

  const resolvedAuthorizationAdapter = authorizationAdapter ?? DefaultAuthorizationAdapter;

  const server: Server<TDatabaseOptimizationOptions> = {
    shutdown() {
      return serverImpl.shutdown();
    },

    reloadSchema() {
      const managementContext = serverImpl.createInternalContext(null);
      return serverImpl.reloadSchema(managementContext);
    },

    addPlugin(plugin) {
      serverImpl.addPlugin(plugin);
    },

    optimizeDatabase(options) {
      const managementContext = serverImpl.createInternalContext(null);
      return databaseAdapter.managementOptimize(managementContext, options);
    },

    processNextDirtyEntity(filter: EntityReference | undefined) {
      const managementContext = serverImpl.createInternalContext(null);
      return managementDirtyProcessNextEntity(
        serverImpl.getAdminSchema(),
        databaseAdapter,
        managementContext,
        filter,
      );
    },

    getSyncEvents(
      query: SyncEventQuery,
    ): PromiseResult<SyncEventsPayload, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
      const managementContext = serverImpl.createInternalContext(null);
      return managementGetSyncEvents(databaseAdapter, managementContext, query);
    },

    async applySyncEvent(
      event: SyncEvent,
    ): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
      const authContext = serverImpl.createInternalContext(null);

      if (event.type === EventType.createPrincipal) {
        const applyResult = await managementApplyAuthSyncEvent(databaseAdapter, authContext, event);
        if (applyResult.isError()) return applyResult;
        return ok(undefined);
      }

      const sessionResult = await authCreateSyncSessionForSubject(databaseAdapter, authContext, {
        subjectId: event.createdBy,
      });
      if (sessionResult.isError()) return sessionResult;
      const contextResult = serverImpl.createSessionContext(
        sessionResult.value,
        null,
        serverLogger ?? null,
        null,
      );
      if (contextResult.isError()) return contextResult;

      const applyResult = await managementApplySyncEvent(
        serverImpl.getAdminSchema(),
        resolvedAuthorizationAdapter,
        databaseAdapter,
        contextResult.value,
        event,
      );
      if (applyResult.isError()) return applyResult;

      if (event.type === EventType.updateSchema) {
        const updatedSchema = applyResult.value as AdminSchemaWithMigrations;
        serverImpl.setAdminSchema(updatedSchema.spec);
      }
      return ok(undefined);
    },

    getPrincipals(
      paging?: Paging,
    ): PromiseResult<
      Connection<Edge<SyncPrincipal, typeof ErrorType.Generic>> | null,
      typeof ErrorType.BadRequest | typeof ErrorType.Generic
    > {
      const managementContext = serverImpl.createInternalContext(null);
      return autGetPrincipals(databaseAdapter, managementContext, paging);
    },

    getPrincipalsTotalCount(): PromiseResult<number, typeof ErrorType.Generic> {
      const managementContext = serverImpl.createInternalContext(null);
      return autGetPrincipalsTotalCount(databaseAdapter, managementContext);
    },

    createPrincipal(
      principal: SyncPrincipal,
    ): PromiseResult<
      { effect: 'created' | 'none' },
      typeof ErrorType.Conflict | typeof ErrorType.Generic
    > {
      const managementContext = serverImpl.createInternalContext(null);
      return authCreatePrincipal(databaseAdapter, managementContext, principal);
    },

    createSession: async <TSession extends Session>({
      provider,
      identifier,
      defaultAuthKeys,
      logger: sessionLogger,
      databasePerformance,
      readonly,
    }: {
      provider: string;
      identifier: string;
      defaultAuthKeys?: readonly string[] | null;
      logger?: Logger | null;
      databasePerformance?: DatabasePerformanceCallbacks | null;
      readonly?: boolean;
    }): PromiseResult<
      CreateSessionPayload<TSession>,
      typeof ErrorType.BadRequest | typeof ErrorType.Generic
    > => {
      const authContext = serverImpl.createInternalContext(databasePerformance ?? null);
      const sessionResult = await authCreateSession(
        databaseAdapter,
        authContext,
        provider,
        identifier,
        readonly ?? false,
      );
      if (sessionResult.isError()) return sessionResult;
      const { principalEffect, session } = sessionResult.value;

      const contextResult = serverImpl.createSessionContext(
        session,
        defaultAuthKeys ?? null,
        sessionLogger ?? serverLogger ?? null,
        databasePerformance ?? null,
      );
      if (contextResult.isError()) return contextResult;

      return ok({
        principalEffect,
        context: contextResult.value as SessionContext<TSession>,
      });
    },

    createAdminClient: <
      TClient extends AdminClient<
        AdminEntity<string, object>,
        Component<string, object>
      > = AdminClient,
    >(
      context: SessionContext | ContextProvider<SessionContext>,
      middleware?: AdminClientMiddleware<SessionContext>[],
    ) =>
      createServerAdminClient({
        context,
        authorizationAdapter: resolvedAuthorizationAdapter,
        databaseAdapter,
        serverImpl,
        middleware: serverImpl.resolveAdminClientMiddleware(middleware ?? []),
      }) as TClient,

    createPublishedClient: <
      TClient extends PublishedClient<
        PublishedEntity<string, object>,
        Component<string, object>
      > = PublishedClient,
    >(
      context: SessionContext | ContextProvider<SessionContext>,
      middleware?: PublishedClientMiddleware<SessionContext>[],
    ) =>
      createServerPublishedClient({
        context,
        authorizationAdapter: resolvedAuthorizationAdapter,
        databaseAdapter,
        serverImpl,
        middleware: serverImpl.resolvePublishedClientMiddleware(middleware ?? []),
      }) as TClient,
  };

  return ok(server);
}
