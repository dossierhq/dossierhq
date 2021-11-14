import type {
  AdminClient,
  AdminClientMiddleware,
  ContextProvider,
  ErrorType,
  Logger,
  PromiseResult,
  PublishedClient,
  PublishedClientMiddleware,
  AdminSchemaSpecification,
} from '@jonasb/datadata-core';
import { assertIsDefined, NoOpLogger, notOk, ok, AdminSchema } from '@jonasb/datadata-core';
import type { DatabaseAdapter, Session, SessionContext } from '.';
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
  createSession(
    provider: string,
    identifier: string,
    logger?: Logger
  ): PromiseResult<CreateSessionPayload, ErrorType.BadRequest | ErrorType.Generic>;
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
  #logger: Logger;
  #schema: AdminSchema | null = null;

  constructor({ databaseAdapter, logger }: { databaseAdapter: DatabaseAdapter; logger?: Logger }) {
    this.#databaseAdapter = databaseAdapter;
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
    this.#schema = new AdminSchema(result.value);
    return ok(undefined);
  }

  getSchema(): AdminSchema {
    if (!this.#schema) {
      throw new Error('AdminSchema is not set');
    }
    return this.#schema;
  }

  setSchema(schemaSpec: AdminSchemaSpecification): void {
    this.#schema = new AdminSchema(schemaSpec);
  }

  createInternalContext(logger?: Logger): InternalContext {
    assertIsDefined(this.#databaseAdapter);
    return new InternalContextImpl(this.#databaseAdapter, logger ?? this.#logger);
  }

  createSessionContext(session: Session, logger?: Logger): SessionContext {
    assertIsDefined(this.#databaseAdapter);
    return new SessionContextImpl(session, this.#databaseAdapter, logger ?? this.#logger);
  }
}

export async function createServer({
  databaseAdapter,
  logger,
}: {
  databaseAdapter: DatabaseAdapter;
  logger?: Logger;
}): PromiseResult<Server, ErrorType.Generic> {
  const serverImpl = new ServerImpl({ databaseAdapter, logger });
  const authContext = serverImpl.createInternalContext();
  const loadSchemaResult = await serverImpl.reloadSchema(authContext);
  if (loadSchemaResult.isError()) {
    return loadSchemaResult;
  }
  const server: Server = {
    shutdown() {
      return serverImpl.shutdown();
    },
    createSession: async (
      provider,
      identifier,
      logger
    ): PromiseResult<CreateSessionPayload, ErrorType.BadRequest | ErrorType.Generic> => {
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
      const context = serverImpl.createSessionContext(session, logger);
      return ok({ principalEffect, context });
    },
    createAdminClient: (context, middleware) =>
      createServerAdminClient({
        context,
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
