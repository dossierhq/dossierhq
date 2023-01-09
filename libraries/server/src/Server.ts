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
} from '@jonasb/datadata-core';
import { AdminSchema, assertIsDefined, NoOpLogger, notOk, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter, Session } from '@jonasb/datadata-database-adapter';
import { authCreateSession, verifyAuthKeysFormat } from './Auth.js';
import type { AuthorizationAdapter } from './AuthorizationAdapter.js';
import type { InternalContext, SessionContext } from './Context.js';
import { InternalContextImpl, SessionContextImpl } from './Context.js';
import { getSchemaSpecification } from './Schema.js';
import { createServerAdminClient } from './ServerAdminClient.js';
import { createServerPublishedClient } from './ServerPublishedClient.js';

export interface CreateSessionPayload {
  principalEffect: 'created' | 'none';
  context: SessionContext;
}

export interface Server {
  shutdown(): PromiseResult<void, typeof ErrorType.Generic>;
  createSession(params: {
    provider: string;
    identifier: string;
    defaultAuthKeys: readonly string[];
    logger?: Logger;
  }): PromiseResult<CreateSessionPayload, typeof ErrorType.BadRequest | typeof ErrorType.Generic>;
  createAdminClient<TClient extends AdminClient<AdminEntity<string, object>> = AdminClient>(
    context: SessionContext | ContextProvider<SessionContext>,
    middleware?: AdminClientMiddleware<SessionContext>[]
  ): TClient;
  createPublishedClient<
    TClient extends PublishedClient<PublishedEntity<string, object>> = PublishedClient
  >(
    context: SessionContext | ContextProvider<SessionContext>,
    middleware?: PublishedClientMiddleware<SessionContext>[]
  ): TClient;
}

export class ServerImpl {
  #databaseAdapter: DatabaseAdapter | null;
  #logger: Logger;
  #adminSchema: AdminSchema | null = null;
  #publishedSchema: PublishedSchema | null = null;

  constructor({ databaseAdapter, logger }: { databaseAdapter: DatabaseAdapter; logger?: Logger }) {
    this.#databaseAdapter = databaseAdapter;
    this.#logger = logger ?? NoOpLogger;
  }

  async shutdown(): PromiseResult<void, typeof ErrorType.Generic> {
    if (this.#databaseAdapter) {
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

  createInternalContext(logger?: Logger): InternalContext {
    assertIsDefined(this.#databaseAdapter);
    return new InternalContextImpl(this.#databaseAdapter, logger ?? this.#logger);
  }

  createSessionContext(
    session: Readonly<Session>,
    defaultAuthKeys: readonly string[],
    logger: Logger | undefined
  ): Result<SessionContext, typeof ErrorType.BadRequest> {
    assertIsDefined(this.#databaseAdapter);

    const verifyResult = verifyAuthKeysFormat(defaultAuthKeys);
    if (verifyResult.isError()) return verifyResult;

    return ok(
      new SessionContextImpl(
        session,
        defaultAuthKeys,
        this.#databaseAdapter,
        logger ?? this.#logger
      )
    );
  }
}

export async function createServer({
  databaseAdapter,
  authorizationAdapter,
  logger: serverLogger,
}: {
  databaseAdapter: DatabaseAdapter;
  authorizationAdapter: AuthorizationAdapter;
  logger?: Logger;
}): PromiseResult<Server, typeof ErrorType.Generic> {
  const serverImpl = new ServerImpl({
    databaseAdapter,
    logger: serverLogger,
  });
  const authContext = serverImpl.createInternalContext();
  const loadSchemaResult = await serverImpl.reloadSchema(authContext);
  if (loadSchemaResult.isError()) {
    return loadSchemaResult;
  }
  const server: Server = {
    shutdown() {
      return serverImpl.shutdown();
    },
    createSession: async ({
      provider,
      identifier,
      defaultAuthKeys,
      logger: sessionLogger,
    }): PromiseResult<
      CreateSessionPayload,
      typeof ErrorType.BadRequest | typeof ErrorType.Generic
    > => {
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
        sessionLogger ?? serverLogger
      );
      if (contextResult.isError()) return contextResult;

      return ok({ principalEffect, context: contextResult.value });
    },
    createAdminClient: <TClient extends AdminClient<AdminEntity<string, object>> = AdminClient>(
      context: SessionContext | ContextProvider<SessionContext>,
      middleware?: AdminClientMiddleware<SessionContext>[]
    ) =>
      createServerAdminClient({
        context,
        authorizationAdapter,
        databaseAdapter,
        serverImpl,
        middleware: middleware ?? [],
      }) as TClient,
    createPublishedClient: <
      TClient extends PublishedClient<PublishedEntity<string, object>> = PublishedClient
    >(
      context: SessionContext | ContextProvider<SessionContext>,
      middleware?: PublishedClientMiddleware<SessionContext>[]
    ) =>
      createServerPublishedClient({
        context,
        authorizationAdapter,
        databaseAdapter,
        serverImpl,
        middleware: middleware ?? [],
      }) as TClient,
  };

  return ok(server);
}
