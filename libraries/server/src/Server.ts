import type {
  AdminClient,
  AdminClientMiddleware,
  AdminEntity,
  AdminSchemaSpecification,
  ContextProvider,
  ErrorType,
  Logger,
  PromiseResult,
  PublishedClient,
  PublishedClientMiddleware,
  PublishedEntity,
  PublishedSchema,
  Result,
  ValueItem,
} from '@dossierhq/core';
import { AdminSchema, NoOpLogger, assertIsDefined, notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseOptimizationOptions,
  DatabasePerformanceCallbacks,
  Session,
} from '@dossierhq/database-adapter';
import { authCreateSession, verifyAuthKeysFormat } from './Auth.js';
import type { AuthorizationAdapter } from './AuthorizationAdapter.js';
import type { InternalContext, SessionContext } from './Context.js';
import { InternalContextImpl, SessionContextImpl } from './Context.js';
import { getSchemaSpecification } from './Schema.js';
import { createServerAdminClient } from './ServerAdminClient.js';
import { createServerPublishedClient } from './ServerPublishedClient.js';
import { managementDirtyProcessNextEntity } from './management/managementDirtyProcessNextEntity.js';

export interface CreateSessionPayload {
  principalEffect: 'created' | 'none';
  context: SessionContext;
}

export interface Server<
  TDatabaseOptimizationOptions extends DatabaseOptimizationOptions = DatabaseOptimizationOptions
> {
  shutdown(): PromiseResult<void, typeof ErrorType.Generic>;

  addPlugin(plugin: ServerPlugin): void;

  optimizeDatabase(
    options: TDatabaseOptimizationOptions
  ): PromiseResult<void, typeof ErrorType.Generic>;

  processNextDirtyEntity(): PromiseResult<
    { id: string; valid: boolean; validPublished: boolean | null } | null,
    typeof ErrorType.Generic
  >;

  createSession(params: {
    provider: string;
    identifier: string;
    defaultAuthKeys: readonly string[];
    logger: Logger | null;
    databasePerformance: DatabasePerformanceCallbacks | null;
  }): PromiseResult<CreateSessionPayload, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;

  createAdminClient<
    TClient extends AdminClient<
      AdminEntity<string, object>,
      ValueItem<string, object>
    > = AdminClient
  >(
    context: SessionContext | ContextProvider<SessionContext>,
    middleware?: AdminClientMiddleware<SessionContext>[]
  ): TClient;

  createPublishedClient<
    TClient extends PublishedClient<
      PublishedEntity<string, object>,
      ValueItem<string, object>
    > = PublishedClient
  >(
    context: SessionContext | ContextProvider<SessionContext>,
    middleware?: PublishedClientMiddleware<SessionContext>[]
  ): TClient;
}

export interface ServerPlugin {
  onCreateAdminClient(
    pipeline: AdminClientMiddleware<SessionContext>[]
  ): AdminClientMiddleware<SessionContext>[];

  onCreatePublishedClient(
    pipeline: PublishedClientMiddleware<SessionContext>[]
  ): PublishedClientMiddleware<SessionContext>[];

  onServerShutdown(): void;
}

export class ServerImpl {
  #databaseAdapter: DatabaseAdapter | null;
  #logger: Logger;
  #adminSchema: AdminSchema | null = null;
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

  async reloadSchema(context: InternalContext): PromiseResult<void, typeof ErrorType.Generic> {
    assertIsDefined(this.#databaseAdapter);
    const result = await getSchemaSpecification(this.#databaseAdapter, context, true);
    if (result.isError()) {
      return result;
    }
    this.setAdminSchema(result.value);
    return ok(undefined);
  }

  addPlugin(plugin: ServerPlugin): void {
    this.#plugins.push(plugin);
  }

  getAdminSchema(): AdminSchema {
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

  setAdminSchema(schemaSpec: AdminSchemaSpecification): void {
    this.#adminSchema = new AdminSchema(schemaSpec);
    this.#publishedSchema = this.#adminSchema.toPublishedSchema();
  }

  createInternalContext(databasePerformance: DatabasePerformanceCallbacks | null): InternalContext {
    assertIsDefined(this.#databaseAdapter);
    return new InternalContextImpl(this.#databaseAdapter, this.#logger, databasePerformance);
  }

  createSessionContext(
    session: Readonly<Session>,
    defaultAuthKeys: readonly string[],
    logger: Logger | null,
    databasePerformance: DatabasePerformanceCallbacks | null
  ): Result<SessionContext, typeof ErrorType.BadRequest> {
    assertIsDefined(this.#databaseAdapter);

    const verifyResult = verifyAuthKeysFormat(defaultAuthKeys);
    if (verifyResult.isError()) return verifyResult;

    return ok(
      new SessionContextImpl(
        session,
        defaultAuthKeys,
        this.#databaseAdapter,
        logger ?? this.#logger,
        databasePerformance
      )
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
  TDatabaseOptimizationOptions extends DatabaseOptimizationOptions
>({
  databaseAdapter,
  authorizationAdapter,
  logger: serverLogger,
}: {
  databaseAdapter: DatabaseAdapter<TDatabaseOptimizationOptions>;
  authorizationAdapter: AuthorizationAdapter;
  logger?: Logger;
}): PromiseResult<Server<TDatabaseOptimizationOptions>, typeof ErrorType.Generic> {
  const serverImpl = new ServerImpl({
    databaseAdapter,
    logger: serverLogger,
  });
  const loadSchemaResult = await serverImpl.reloadSchema(serverImpl.createInternalContext(null));
  if (loadSchemaResult.isError()) return loadSchemaResult;

  const server: Server<TDatabaseOptimizationOptions> = {
    shutdown() {
      return serverImpl.shutdown();
    },

    addPlugin(plugin) {
      serverImpl.addPlugin(plugin);
    },

    optimizeDatabase(options) {
      const managementContext = serverImpl.createInternalContext(null);
      return databaseAdapter.managementOptimize(managementContext, options);
    },

    processNextDirtyEntity() {
      const managementContext = serverImpl.createInternalContext(null);
      return managementDirtyProcessNextEntity(
        serverImpl.getAdminSchema(),
        databaseAdapter,
        managementContext
      );
    },

    createSession: async ({
      provider,
      identifier,
      defaultAuthKeys,
      logger: sessionLogger,
      databasePerformance,
    }): PromiseResult<
      CreateSessionPayload,
      typeof ErrorType.BadRequest | typeof ErrorType.Generic
    > => {
      const authContext = serverImpl.createInternalContext(databasePerformance);
      const sessionResult = await authCreateSession(
        databaseAdapter,
        authContext,
        provider,
        identifier
      );
      if (sessionResult.isError()) return sessionResult;
      const { principalEffect, session } = sessionResult.value;

      const contextResult = serverImpl.createSessionContext(
        session,
        defaultAuthKeys ?? [],
        (sessionLogger ?? serverLogger) || null,
        databasePerformance
      );
      if (contextResult.isError()) return contextResult;

      return ok({ principalEffect, context: contextResult.value });
    },

    createAdminClient: <
      TClient extends AdminClient<
        AdminEntity<string, object>,
        ValueItem<string, object>
      > = AdminClient
    >(
      context: SessionContext | ContextProvider<SessionContext>,
      middleware?: AdminClientMiddleware<SessionContext>[]
    ) =>
      createServerAdminClient({
        context,
        authorizationAdapter,
        databaseAdapter,
        serverImpl,
        middleware: serverImpl.resolveAdminClientMiddleware(middleware ?? []),
      }) as TClient,

    createPublishedClient: <
      TClient extends PublishedClient<
        PublishedEntity<string, object>,
        ValueItem<string, object>
      > = PublishedClient
    >(
      context: SessionContext | ContextProvider<SessionContext>,
      middleware?: PublishedClientMiddleware<SessionContext>[]
    ) =>
      createServerPublishedClient({
        context,
        authorizationAdapter,
        databaseAdapter,
        serverImpl,
        middleware: serverImpl.resolvePublishedClientMiddleware(middleware ?? []),
      }) as TClient,
  };

  return ok(server);
}
