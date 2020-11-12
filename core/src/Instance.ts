import type { AuthContext, Context, Schema, Session, SessionContext } from '.';
import { AuthContextImpl, SessionContextImpl } from './Context';
import type { Pool } from './Db';
import * as Db from './Db';
import { getSchema } from './Schema';

export default class Instance {
  #pool: Pool | null;
  #schema: Schema | null = null;

  constructor({ databaseUrl }: { databaseUrl: string }) {
    this.#pool = Db.connect(databaseUrl);
  }

  async shutdown(): Promise<void> {
    if (this.#pool) {
      await Db.disconnect(this.#pool);
      this.#pool = null;
    } else {
      throw new Error('Trying to shutdown twice');
    }
  }

  async reloadSchema(context: Context<unknown>): Promise<void> {
    this.#schema = await getSchema(context);
  }

  getSchema(): Schema {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.#schema!;
  }

  createAuthContext(): AuthContext {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return new AuthContextImpl(this.#pool!);
  }

  createSessionContext(session: Session): SessionContext {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return new SessionContextImpl(session, this.#pool!);
  }
}
