import type { ErrorType, PromiseResult, Schema } from '@jonasb/datadata-core';
import { assertIsDefined, notOk, ok } from '@jonasb/datadata-core';
import type { AuthContext, Context, DatabaseAdapter, Session, SessionContext } from '.';
import { AuthContextImpl, SessionContextImpl } from './Context';
import { getSchema, setSchema } from './Schema';

export interface Server2 {
  schema: Readonly<Schema>;
  shutdown(): PromiseResult<void, ErrorType.Generic>;
  reloadSchema(context: Context): PromiseResult<void, ErrorType.Generic>;

  createAuthContext(): AuthContext;
}

export default class Server {
  #databaseAdapter: DatabaseAdapter | null;
  #schema: Schema | null = null;

  constructor({ databaseAdapter }: { databaseAdapter: DatabaseAdapter }) {
    this.#databaseAdapter = databaseAdapter;
  }

  async shutdownResult(): PromiseResult<void, ErrorType.Generic> {
    if (this.#databaseAdapter) {
      await this.#databaseAdapter.disconnect();
      this.#databaseAdapter = null;
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

  createAuthContext(): AuthContext {
    assertIsDefined(this.#databaseAdapter);
    return new AuthContextImpl(this, this.#databaseAdapter);
  }

  createSessionContext(session: Session): SessionContext {
    assertIsDefined(this.#databaseAdapter);
    return new SessionContextImpl(this, session, this.#databaseAdapter);
  }
}

export async function createServer({
  databaseAdapter,
}: {
  databaseAdapter: DatabaseAdapter;
}): PromiseResult<Server2, ErrorType.Generic> {
  const server = new Server({ databaseAdapter });
  const authContext = server.createAuthContext();
  const loadSchemaResult = await server.reloadSchemaResult(authContext);
  if (loadSchemaResult.isError()) {
    return loadSchemaResult;
  }
  const server2: Server2 = {
    get schema() {
      return server.getSchema();
    },
    shutdown() {
      return server.shutdownResult();
    },
    reloadSchema() {
      return server.reloadSchemaResult(authContext);
    },
    createAuthContext() {
      return server.createAuthContext();
    },
  };

  return ok(server2);
}
