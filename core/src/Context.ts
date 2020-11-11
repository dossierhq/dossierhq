import type { Session } from '.';
import type { Pool, Queryable } from './Db';
import * as Db from './Db';

export interface Context<TContext> {
  readonly pool: Pool;
  readonly queryable: Queryable;
  withTransaction<T>(callback: (context: TContext) => Promise<T>): Promise<T>;
}

export interface AuthContext extends Context<AuthContext> {
  withTransaction<T>(callback: (context: AuthContext) => Promise<T>): Promise<T>;
}

export interface SessionContext extends Context<SessionContext> {
  readonly session: Session;

  withTransaction<T>(callback: (context: SessionContext) => Promise<T>): Promise<T>;
}

abstract class ContextImpl<TContext> implements Context<TContext> {
  readonly queryable: Queryable;

  constructor(readonly pool: Pool, transactionQueryable: Queryable | null) {
    this.queryable = transactionQueryable ?? pool;
  }

  protected abstract copyWithNewQueryable(transactionQueryable: Queryable): TContext;

  async withTransaction<T>(callback: (context: TContext) => Promise<T>): Promise<T> {
    if (this.pool !== this.queryable) {
      // Already in transaction
      return await Db.withNestedTransaction(this, async () => {
        return callback((this as unknown) as TContext);
      });
    }

    return await Db.withRootTransaction(this, async (client) => {
      const context = this.copyWithNewQueryable(client);
      return callback(context);
    });
  }
}

export class AuthContextImpl extends ContextImpl<AuthContext> implements AuthContext {
  constructor(pool: Pool, transactionQueryable: Queryable | null = null) {
    super(pool, transactionQueryable);
  }

  protected copyWithNewQueryable(transactionQueryable: Queryable): AuthContext {
    return new AuthContextImpl(this.pool, transactionQueryable);
  }
}

export class SessionContextImpl extends ContextImpl<SessionContext> implements SessionContext {
  readonly session: Session;

  constructor(session: Session, pool: Pool, transactionQueryable: Queryable | null = null) {
    super(pool, transactionQueryable);
    this.session = session;
  }

  protected copyWithNewQueryable(transactionQueryable: Queryable): SessionContext {
    return new SessionContextImpl(this.session, this.pool, transactionQueryable);
  }
}
