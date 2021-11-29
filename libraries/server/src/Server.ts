import type {
  AdminClient,
  AdminClientMiddleware,
  AdminSchemaSpecification,
  ContextProvider,
  ErrorType,
  Logger,
  PromiseResult,
  PublishedClient,
  PublishedClientMiddleware,
} from '@jonasb/datadata-core';
import { AdminSchema, assertIsDefined, NoOpLogger, notOk, ok, Schema } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, Session, SessionContext } from '.';
import { createServerAdminClient } from './AdminClient';
import { authCreateSession } from './Auth';
import type { InternalContext } from './Context';
import { InternalContextImpl, SessionContextImpl } from './Context';
import { createServerPublishedClient } from './PublishedClient';
import { getSchemaSpecification } from './Schema';

export interface CreateSessionPayload {
  principalEffect: 'created' | 'none';
  context: SessionContext;
}

export interface Server {
  shutdown(): PromiseResult<void, ErrorType.Generic>;
  createSession(params: {
    provider: string;
    identifier: string;
    defaultAuthorizationKeys?: string[];
    logger?: Logger;
  }): PromiseResult<CreateSessionPayload, ErrorType.BadRequest | ErrorType.Generic>;
  createAdminClient(
    context: SessionContext | ContextProvider<SessionContext>,
    middleware?: AdminClientMiddleware<SessionContext>[]
  ): AdminClient;
  createPublishedClient(
    context: SessionContext | ContextProvider<SessionContext>,
    middleware?: PublishedClientMiddleware<SessionContext>[]
  ): PublishedClient;
}

export class ServerImpl {
  #databaseAdapter: DatabaseAdapter | null;
  #authorizationAdapter: AuthorizationAdapter;
  #logger: Logger;
  #adminSchema: AdminSchema | null = null;
  #schema: Schema | null = null;

  constructor({
    databaseAdapter,
    authorizationAdapter,
    logger,
  }: {
    databaseAdapter: DatabaseAdapter;
    authorizationAdapter: AuthorizationAdapter;
    logger?: Logger;
  }) {
    this.#databaseAdapter = databaseAdapter;
    this.#authorizationAdapter = authorizationAdapter;
    this.#logger = logger ?? NoOpLogger;
  }

  async shutdown(): PromiseResult<void, ErrorType.Generic> {
    if (this.#databaseAdapter) {
      this.#logger.info('Shutting down database adapter');
      await this.#databaseAdapter.disconnect();
      this.#databaseAdapter = null;
      this.#logger.info('Finished shutting server');
      return ok(undefined);
    }
    return notOk.Generic('Trying to shutdown twice');
  }

  async reloadSchema(context: InternalContext): PromiseResult<void, ErrorType.Generic> {
    assertIsDefined(this.#databaseAdapter);
    const result = await getSchemaSpecification(this.#databaseAdapter, context);
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

  getSchema(): Schema {
    if (!this.#schema) {
      throw new Error('Schema is not set');
    }
    return this.#schema;
  }

  setAdminSchema(schemaSpec: AdminSchemaSpecification): void {
    this.#adminSchema = new AdminSchema(schemaSpec);
    this.#schema = new Schema(this.#adminSchema.toPublishedSchema());
  }

  createInternalContext(logger?: Logger): InternalContext {
    assertIsDefined(this.#databaseAdapter);
    return new InternalContextImpl(this.#databaseAdapter, logger ?? this.#logger);
  }

  createSessionContext(
    session: Session,
    defaultAuthorizationKeys: string[],
    logger: Logger | undefined
  ): SessionContext {
    assertIsDefined(this.#databaseAdapter);
    return new SessionContextImpl(
      session,
      defaultAuthorizationKeys,
      this.#databaseAdapter,
      logger ?? this.#logger
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
}): PromiseResult<Server, ErrorType.Generic> {
  const serverImpl = new ServerImpl({
    databaseAdapter,
    authorizationAdapter: authorizationAdapter,
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
      defaultAuthorizationKeys,
      logger: sessionLogger,
    }): PromiseResult<CreateSessionPayload, ErrorType.BadRequest | ErrorType.Generic> => {
      const sessionResult = await authCreateSession(
        databaseAdapter,
        authContext,
        provider,
        identifier
      );
      if (sessionResult.isError()) {
        return sessionResult;
      }
      const { principalEffect, session } = sessionResult.value;
      const context = serverImpl.createSessionContext(
        session,
        defaultAuthorizationKeys ?? [],
        sessionLogger ?? serverLogger
      );
      return ok({ principalEffect, context });
    },
    createAdminClient: (context, middleware) =>
      createServerAdminClient({
        context,
        authorizationAdapter,
        databaseAdapter,
        serverImpl,
        middleware: middleware ?? [],
      }),
    createPublishedClient: (context, middleware) =>
      createServerPublishedClient({
        context,
        databaseAdapter,
        serverImpl,
        middleware: middleware ?? [],
      }),
  };

  return ok(server);
}
