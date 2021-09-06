import type { ErrorType, Logger, PromiseResult, Schema } from '@jonasb/datadata-core';
import { assertIsDefined, notOk, ok } from '@jonasb/datadata-core';
import type { AuthContext, Context, DatabaseAdapter, Session, SessionContext } from '.';
import { authCreateSession } from './Auth';
import { AuthContextImpl, SessionContextImpl } from './Context';
import { getSchema, setSchema } from './Schema';

export interface CreateSessionPayload {
  principalEffect: 'created' | 'none';
  context: SessionContext;
}

export interface Server2 {
  shutdown(): PromiseResult<void, ErrorType.Generic>;
  // TODO reloadSchema(context: Context): PromiseResult<void, ErrorType.Generic>;
  createSession(
    provider: string,
    identifier: string,
    logger?: Logger
  ): PromiseResult<CreateSessionPayload, ErrorType.BadRequest | ErrorType.Generic>;
}

export default class Server {
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

  //TODO remove when migrated to Schema2
  async reloadSchema(context: Context): Promise<void> {
    (await this.reloadSchemaResult(context)).throwIfError();
  }

  async reloadSchemaResult(context: Context): PromiseResult<void, ErrorType.Generic> {
    const result = await getSchema(context);
    if (result.isError()) {
      return result;
    }
    this.#schema = result.value;
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

  createAuthContext(logger?: Logger): AuthContext {
    assertIsDefined(this.#databaseAdapter);
    return new AuthContextImpl(this, this.#databaseAdapter, logger ?? this.#logger);
  }

  createSessionContext(session: Session, logger?: Logger): SessionContext {
    assertIsDefined(this.#databaseAdapter);
    return new SessionContextImpl(this, session, this.#databaseAdapter, logger ?? this.#logger);
  }
}

export async function createServer({
  databaseAdapter,
  logger,
}: {
  databaseAdapter: DatabaseAdapter;
  logger: Logger;
}): PromiseResult<Server2, ErrorType.Generic> {
  const server = new Server({ databaseAdapter, logger });
  const authContext = server.createAuthContext();
  const loadSchemaResult = await server.reloadSchemaResult(authContext);
  if (loadSchemaResult.isError()) {
    return loadSchemaResult;
  }
  const server2: Server2 = {
    shutdown() {
      return server.shutdownResult();
    },
    createSession: async (
      provider,
      identifier,
      logger
    ): PromiseResult<CreateSessionPayload, ErrorType.BadRequest | ErrorType.Generic> => {
      const sessionResult = await authCreateSession(authContext, provider, identifier);
      if (sessionResult.isError()) {
        return sessionResult;
      }
      const { principalEffect, session } = sessionResult.value;
      const context = server.createSessionContext(session, logger);
      return ok({ principalEffect, context });
    },
  };

  return ok(server2);
}
