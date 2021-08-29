import type { ErrorType, PromiseResult, Schema } from '@jonasb/datadata-core';
import { assertIsDefined } from '@jonasb/datadata-core';
import type { AuthContext, Context, Session, SessionContext } from '.';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter-core';
import { AuthContextImpl, SessionContextImpl } from './Context';
import { getSchema, setSchema } from './Schema';

export default class Server {
  #databaseAdapter: DatabaseAdapter | null;
  #schema: Schema | null = null;

  constructor({ databaseAdapter }: { databaseAdapter: DatabaseAdapter }) {
    this.#databaseAdapter = databaseAdapter;
  }

  async shutdown(): Promise<void> {
    if (this.#databaseAdapter) {
      await this.#databaseAdapter.disconnect();
      this.#databaseAdapter = null;
    } else {
      throw new Error('Trying to shutdown twice');
    }
  }

  async reloadSchema(context: Context<unknown>): Promise<void> {
    this.#schema = await getSchema(context);
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
