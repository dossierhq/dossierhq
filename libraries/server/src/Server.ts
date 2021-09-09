import type {
  AdminClient,
  ContextProvider,
  ErrorType,
  Logger,
  PromiseResult,
  PublishedClient,
} from '@jonasb/datadata-core';
import { assertIsDefined, notOk, ok, Schema } from '@jonasb/datadata-core';
import type { DatabaseAdapter, Session, SessionContext } from '.';
import { createServerAdminClient } from './AdminClient';
import { authCreateSession } from './Auth';
import type { InternalContext } from './Context';
import { InternalContextImpl, SessionContextImpl } from './Context';
import { createServerPublishedClient } from './PublishedClient';
import { getSchemaSpecification, setSchema } from './Schema';

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
  createAdminClient(context: SessionContext | ContextProvider<SessionContext>): AdminClient;
  createPublishedClient(context: SessionContext): PublishedClient;
}

export class ServerImpl {
  #databaseAdapter: DatabaseAdapter | null;
  #logger: Logger;
  #schema: Schema | null = null;

  constructor({ databaseAdapter, logger }: { databaseAdapter: DatabaseAdapter; logger?: Logger }) {
    this.#databaseAdapter = databaseAdapter;
    if (!logger) {
      const noop = () => {
        //empty
      };
      logger = {
        error: noop,
        warn: noop,
        info: noop,
        debug: noop,
      };
    }
    this.#logger = logger;
  }

  async shutdownResult(): PromiseResult<void, ErrorType.Generic> {
    if (this.#databaseAdapter) {
      this.#logger.info('Shutting down database adapter');
      await this.#databaseAdapter.disconnect();
      this.#databaseAdapter = null;
      this.#logger.info('Finished shutting server');
      return ok(undefined);
    }
    return notOk.Generic('Trying to shutdown twice');
  }

  //TODO remove when migrated to Schema2
  async shutdown(): Promise<void> {
    (await this.shutdownResult()).throwIfError();
  }

  async reloadSchemaResult(context: InternalContext): PromiseResult<void, ErrorType.Generic> {
    assertIsDefined(this.#databaseAdapter);
    const result = await getSchemaSpecification(this.#databaseAdapter, context);
    if (result.isError()) {
      return result;
    }
    this.#schema = new Schema(result.value);
    return ok(undefined);
  }

  getSchema(): Schema {
    if (!this.#schema) {
      throw new Error('Schema is not set');
    }
    return this.#schema;
  }

  async setSchema(
    context: SessionContext,
    schema: Schema
  ): PromiseResult<void, ErrorType.BadRequest> {
    const result = await setSchema(context, schema);
    if (result.isOk()) {
      this.#schema = schema;
    }
    return result;
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
  const loadSchemaResult = await serverImpl.reloadSchemaResult(authContext);
  if (loadSchemaResult.isError()) {
    return loadSchemaResult;
  }
  const server: Server = {
    shutdown() {
      return serverImpl.shutdownResult();
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
    createAdminClient: (context) =>
      createServerAdminClient({ context, databaseAdapter, serverImpl }),
    createPublishedClient: (context) => createServerPublishedClient({ context, serverImpl }),
  };

  return ok(server);
}
